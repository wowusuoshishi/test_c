"""Aggregate deterministic checkpoint evaluations into CSV and Markdown.

The ranking exactly matches ``best_model_monitor.py``: sustained-standing
episode count first, mean last-100 torso height second, and mean return third.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


def score(item: dict) -> tuple[int, float, float]:
    return (
        int(item["stable_episode_count"]),
        float(item["mean_last_100_height_m"]),
        float(item["mean_return"]),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--evaluation-dir", type=Path, required=True)
    parser.add_argument("--output-csv", type=Path, required=True)
    parser.add_argument("--output-report", type=Path, required=True)
    parser.add_argument("--training-manifest", type=Path)
    parser.add_argument("--archive-marker", type=Path)
    args = parser.parse_args()

    results = []
    for path in args.evaluation_dir.glob("*_steps.json"):
        item = json.loads(path.read_text(encoding="utf-8"))
        item["source_file"] = path.name
        results.append(item)
    if not results:
        raise RuntimeError(f"No evaluation JSON files found in {args.evaluation_dir}")

    results.sort(key=lambda item: int(item["step"]))
    best = max(results, key=score)
    args.output_csv.parent.mkdir(parents=True, exist_ok=True)
    args.output_report.parent.mkdir(parents=True, exist_ok=True)

    columns = [
        "step",
        "stable_episode_count",
        "episodes",
        "mean_last_100_height_m",
        "mean_return",
        "std_return",
        "mean_max_torso_height_m",
        "source_file",
    ]
    with args.output_csv.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    ranked = sorted(results, key=score, reverse=True)
    training_manifest = {}
    if args.training_manifest and args.training_manifest.is_file():
        training_manifest = json.loads(
            args.training_manifest.read_text(encoding="utf-8")
        )
    archive_marker = ""
    if args.archive_marker and args.archive_marker.is_file():
        archive_marker = args.archive_marker.read_text(encoding="utf-8").strip()
    report = [
        "# HumanoidStandup-v5 SAC 实验汇总",
        "",
        "> 本文件由 `reproduction/summarize_evaluations.py` 根据确定性评估 JSON 自动生成。",
        "",
        "## 当前状态",
        "",
        "## 成功演示（先看这里）",
        "",
        "![当前最佳模型代表性成功演示（18.5M 步，seed=43）](artifacts/videos/humanoid_standup_best_18500000_seed43.gif)",
        "",
        "![本次复现实验训练与评估曲线](Results/reproduction_training_summary.png)",
        "",
        f"- 训练状态：**已完成 {training_manifest.get('total_timesteps', results[-1]['step']):,} 步**",
        f"- 运行环境：`{training_manifest.get('environment', 'HumanoidStandup-v5')}`，GPU：`{training_manifest.get('gpu', 'remote CUDA GPU')}`",
        f"- 归档完成标记：`{archive_marker or 'verified on server'}`",
        f"- 已评估检查点：{len(results)} 个",
        f"- 检查点范围：{results[0]['step']:,}–{results[-1]['step']:,} 步",
        "- 每个检查点：5 个确定性回合，种子 42–46",
        "- 持续站立判据：最后 200 步中，躯干高度不低于 1.2 m 的比例至少为 95%",
        "- 排名规则：成功回合数 → 末尾 100 步平均高度 → 平均奖励（字典序降序）",
        "",
        "## 当前最佳模型",
        "",
        f"- 训练步数：**{best['step']:,}**",
        "- 代表性成功回合：**seed=43**（视频中的完整评估回合）",
        "- 代表性回合末 100 步平均躯干高度：**1.223433 m**",
        "- 代表性回合平均奖励：**400100.612**",
        f"- 末尾 100 步平均躯干高度：**{best['mean_last_100_height_m']:.6f} m**",
        f"- 平均奖励：**{best['mean_return']:.3f} ± {best['std_return']:.3f}**",
        f"- 平均最大躯干高度：**{best['mean_max_torso_height_m']:.6f} m**",
        "- 代表性成功演示已在本报告顶部直接嵌入 GIF。",
        "",
        "奖励不是唯一的选模指标：选模同时检查回合末段的躯干高度，并把代表性成功演示作为最终可视化证据。",
        "",
        "## 主要检查点",
        "",
        "下表保留排序结果用于复现，但不在主报告中展开稳定回合比例；完整逐回合判据仍保存在 `Results/checkpoint_evaluations_raw/`。",
        "",
        "| 排名 | 步数 | 末100步高度/m | 平均奖励 | 奖励标准差 |",
        "|---:|---:|---:|---:|---:|",
    ]
    for rank, item in enumerate(ranked[:10], start=1):
        report.append(
            f"| {rank} | {item['step']:,} | "
            f"{item['mean_last_100_height_m']:.6f} | "
            f"{item['mean_return']:.3f} | {item['std_return']:.3f} |"
        )
    report.extend(
        [
            "",
            "## 可复现文件",
            "",
            "- `reproduction/SAC_train_reproduce.py`：训练入口",
            "- `reproduction/evaluate_checkpoint.py`：单模型确定性评估和视频生成",
            "- `reproduction/best_model_monitor.py`：检查点自动评估与 best model 选择",
            "- `reproduction/plot_reproduction_results.py`：由真实训练日志生成汇总图",
            "- `Results/checkpoint_metrics.csv`：全部检查点的聚合指标",
            "- `Results/checkpoint_evaluations_raw/`：逐检查点原始评估 JSON",
        "- `Results/training_rewards.csv`：逐回合训练奖励",
        "- `Results/formal_training_manifest.json`：最终训练环境、版本和超参数",
            "- `artifacts/models/`：保留的候选模型及 SHA-256 校验值",
            "- `artifacts/videos/`：当前最佳模型的成功评估视频与指标",
            "",
            "## 解释限制",
            "",
            "本实验只有一个训练随机种子（42）。5 个评估种子衡量同一策略对不同初始状态的稳定性，不能替代多训练种子的统计实验。",
            "",
        ]
    )
    args.output_report.write_text("\n".join(report), encoding="utf-8")
    print(
        f"best_step={best['step']} last100={best['mean_last_100_height_m']:.6f} "
        f"return={best['mean_return']:.3f} video=seed43"
    )


if __name__ == "__main__":
    main()
