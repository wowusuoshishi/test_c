# HumanoidStandup-v5 的 SAC：从环境到参数

本文把本项目的训练命令、SAC 的核心公式和每个主要参数放在一起，便于从零复现和答辩讲解。

## 1. 任务与环境

`HumanoidStandup-v5` 是一个 MuJoCo 连续控制环境：机器人从躺在地面的初始状态开始，用 17 个关节的连续力矩动作尝试站起并保持站立。Gymnasium 的默认观测空间是 348 维，动作空间是 `Box(-0.4, 0.4, (17,), float32)`。

本仓库的正式实验严格复现上游 `Code/SAC_train.py`：`TruncatedObservationWrapper` 只保留原始观测的前 45 个值。因此：

- 环境本身仍是 `HumanoidStandup-v5`，动作仍是 17 维；
- 策略网络实际输入是 45 维，而不是默认的完整 348 维；
- 这保证了与上游仓库和已保存模型的行为一致。若要研究“完整 348 维观测”，必须移除该 wrapper，并重新训练，不能直接加载本实验模型。

## 2. 安装与环境检查

服务器正式运行记录在 [`../Results/formal_training_manifest.json`](../Results/formal_training_manifest.json)。对应版本为 Python 3.9.21、PyTorch 2.5.1+cu124、Gymnasium 1.0.0、MuJoCo 3.2.7、Stable-Baselines3 2.4.0。

```bash
# 推荐把环境放到数据盘
conda create -n humanoid_sac python=3.9.21 -y
conda activate humanoid_sac

# CUDA 12.4 对应的 PyTorch
python -m pip install torch==2.5.1 --index-url https://download.pytorch.org/whl/cu124

python -m pip install -r requirements-server.txt

# 三个最小检查
python -c "import torch; print(torch.__version__, torch.cuda.is_available())"
python -c "import gymnasium as gym; import mujoco; e=gym.make('HumanoidStandup-v5'); print(e.observation_space, e.action_space); e.close()"
```

`torch.cuda.is_available()` 应为 `True`。若只想测试 MuJoCo，不要先启动 25M 步训练；先执行：

```bash
python -c "import gymnasium as gym; e=gym.make('HumanoidStandup-v5'); o,_=e.reset(seed=42); print(o.shape, e.action_space); e.close()"
```

## 3. SAC 的目标

SAC（Soft Actor-Critic）是 off-policy actor-critic 算法。它不只追求高奖励，也鼓励策略保留一定随机性：

\[
J(\pi)=\mathbb{E}\left[\sum_t \gamma^t\left(r_t+\alpha\mathcal{H}(\pi(\cdot|s_t))\right)\right]
\]

其中 `H` 是熵，表示动作分布的不确定性；`alpha` 是熵温度系数。`alpha` 越大，探索越强；太小则容易过早收敛到一个不稳定姿态。

每次更新从 replay buffer 随机抽取 `(s, a, r, s', done)`：

\[
y=r+\gamma(1-done)\left[\min(Q_1^{target},Q_2^{target})-\alpha\log\pi(a'|s')\right]
\]

两个 critic 用均方误差拟合 `y`；actor 通过重参数化采样 `a=\tanh(\mu+\sigma\epsilon)`，最小化：

\[
L_\pi=\mathbb{E}[\alpha\log\pi(a|s)-\min(Q_1,Q_2)]
\]

自动温度调节还会让实际熵接近目标熵：

\[
L_\alpha=-\mathbb{E}[\alpha(\log\pi(a|s)+H_{target})]
\]

## 4. 本项目主要参数

| 参数 | 本实验值 | 意义与调节方向 |
|---|---:|---|
| `env_id` | `HumanoidStandup-v5` | 任务环境；不能改成 Hopper 后继续声称是人形站立实验。 |
| `total_timesteps` | `25,000,000` | 与环境交互的总步数；越大通常越可能学会，但耗时和费用也增加。 |
| `checkpoint_freq` | `500,000` | 每隔多少步保存模型；正式训练结果共评估 50 个检查点。 |
| `seed` | `42` | 训练随机种子。正式实验只有一个训练种子，不能冒充多次独立训练。 |
| `buffer_size` | `1,000,000` | replay buffer 最大 transition 数；太小会忘记早期经验，太大占内存。 |
| `learning_starts` | `10,000` | 先用随机动作填充 buffer，再开始梯度更新，避免初始数据过于单一。 |
| `batch_size` | `256` | 每次梯度更新的样本数；大 batch 更平滑但占显存。 |
| `learning_rate` | `3e-4` | actor/critic 的 Adam 学习率（SB3 SAC 的统一配置）；太大易震荡，太小收敛慢。 |
| `train_freq` | `1` | 每与环境交互 1 步触发一次训练。 |
| `gradient_steps` | `1` | 每次触发做 1 次梯度更新；增加它可提高样本利用率但会降低 SPS。 |
| `gamma` | `0.99` | 折扣因子；越接近 1 越重视长期站立，越小越短视。 |
| `tau` | `0.005` | target critic 的 Polyak 软更新比例；小值更稳，大值跟随更快。 |
| `target_update_interval` | `1` | 每次训练都软更新 target critic。 |
| `ent_coef` | `auto` | 自动学习 `alpha`，而不是固定熵系数。 |
| `target_entropy` | `-17` | 目标熵，约等于 `-action_dim`；Humanoid 动作维度为 17。 |
| `sde_sample_freq` | `-1` | 本实验不使用 State Dependent Exploration；SAC 的高斯策略本身提供探索。 |
| actor/critic 网络 | `256-256` MLP | 两层隐藏层；critic 输入是观测与动作，actor 输出动作分布参数。 |
| `Actor.LOG_STD_MIN/MAX` | `-5/2` | 限制 `log(std)`，防止策略方差数值爆炸或塌缩。 |
| action bounds | `[-0.4,0.4]` | MuJoCo 关节力矩范围；actor 的 `tanh` 输出会按环境范围缩放。 |

### 如何读 SPS

日志中的 `SPS` 是 *steps per second*，即每秒处理的环境步数，不是奖励，也不是成功率。Humanoid 的物理仿真和网络更新较重，所以 GPU 利用率高不一定意味着 SPS 很高。

## 5. 训练、评估与选模

```bash
python reproduction/SAC_train_reproduce.py \
  --total-timesteps 25000000 \
  --checkpoint-freq 500000 \
  --seed 42 \
  --device cuda \
  --output-dir reproduction_outputs/formal_seed42
```

训练结束后，用确定性策略对每个检查点跑 5 个回合（seed 42–46）。本项目的 best model 不是简单取最高 episode return，而按以下字典序选择：

1. 最后 200 步中躯干高度至少 1.2 m 的稳定回合数；
2. 最后 100 步平均躯干高度；
3. 平均 episode return。

这样可以避免“奖励很高但回合末尾又倒下”的模型被误选为最佳模型。当前正式实验的最佳检查点为 18.5M 步，详细数字见 [`../EXPERIMENT_REPORT.md`](../EXPERIMENT_REPORT.md)。

## 6. 与 CleanRL 参考实现的关系

CleanRL 的 `sac_continuous_action.py` 默认示例环境是 `Hopper-v4`，并展示了 twin Q、随机 actor、自动 `alpha`、replay buffer 和 Polyak 更新。此仓库的正式模型来自上游 SB3 版本，`reproduction/SAC_train_reproduce.py` 只做路径、seed、检查点和可复现实验管理改造；因此不要把它描述为“从零重写了 CleanRL 源码”。本仓库同时保留了 CleanRL 作为算法解释和代码对照来源。
