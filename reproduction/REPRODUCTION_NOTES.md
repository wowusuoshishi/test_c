# Reproduction record

Upstream repository: `bcrockett21/SACMujoco_HumanoidStandup-v5`

Pinned upstream commit: `84f8a6443af0c8f476b0e591869473da44d2583a`

## Preserved behavior

- Official `HumanoidStandup-v5` reward and reset behavior.
- The first 45 values of the original 348-dimensional observation.
- Stable-Baselines3 SAC and the hyperparameters in `Code/SAC_train.py`.
- Xavier initialization of all linear layers.
- One environment and one gradient update per environment step after 10,000 warm-up steps.
- Automatic entropy coefficient with target entropy `-17`.
- Checkpoints, replay buffer, reward CSV, TensorBoard events, final model, and GPU execution.

## Execution-only changes

- Replaced the author's Windows/WSL absolute paths and placeholder `file_path` values with a configurable output directory.
- Added a fixed seed (`42` by default) and a machine-readable manifest.
- Made total timesteps and checkpoint frequency configurable for smoke testing and the formal run.
- The formal run uses 25,000,000 steps because the README and report identify that duration as the successful experiment. The checked-in training script currently says 20,000,000 steps.

## Upstream inconsistencies and missing pins

- `Code/SAC_train.py` uses `batch_size=256`; the PDF table says 245. The executable source is treated as authoritative.
- The source assigns `Actor.LOG_STD_MIN = -5`, while the report describes a lower bound of `-20`. The reproduction retains the source statement.
- `Code/visualize.py` uses a rolling window of 1,000 episodes; the report text describes 500 episodes.
- The README did not pin MuJoCo or list `imageio`, although the environment needs both. MuJoCo `3.2.7` is pinned because it was the newest release available at the upstream commit date (2025-02-20) with a Python 3.9 Linux wheel. `imageio` is installed as Gymnasium's MuJoCo rendering dependency.
- The repository contains result media and a report but no trained model checkpoint, so the policy must be retrained.

## Reproduction environment

- Python 3.9.21
- PyTorch 2.5.1+cu124
- Stable-Baselines3 2.4.0
- Gymnasium 1.0.0
- NumPy 1.26.4
- Cloudpickle 3.1.0
- MuJoCo 3.2.7

The exact resolved package list and machine details are captured alongside each run.
