"""Create a two-panel summary figure from this reproduction's real data."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


def read_numeric_csv(path: Path) -> dict[str, np.ndarray]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise RuntimeError(f"No rows found in {path}")
    return {
        key: np.asarray([float(row[key]) for row in rows], dtype=float)
        for key in rows[0]
        if key and key != "source_file"
    }


def moving_average(values: np.ndarray, window: int) -> np.ndarray:
    if values.size < window:
        return np.full(values.shape, np.mean(values))
    kernel = np.ones(window, dtype=float) / window
    valid = np.convolve(values, kernel, mode="valid")
    prefix = np.full(window - 1, np.nan)
    return np.concatenate([prefix, valid])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rewards-csv", type=Path, required=True)
    parser.add_argument("--metrics-csv", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--reward-window", type=int, default=500)
    args = parser.parse_args()

    rewards = read_numeric_csv(args.rewards_csv)
    metrics = read_numeric_csv(args.metrics_csv)
    episode = rewards["Episode"]
    reward = rewards["Reward"]
    smoothed = moving_average(reward, args.reward_window)
    steps_million = metrics["step"] / 1_000_000

    plt.rcParams.update(
        {
            "font.size": 10,
            "axes.titlesize": 12,
            "axes.labelsize": 10,
            "figure.dpi": 120,
        }
    )
    fig, axes = plt.subplots(2, 1, figsize=(10, 8), constrained_layout=True)

    axes[0].plot(episode, reward, color="#8ecae6", alpha=0.18, linewidth=0.6, label="Episode return")
    axes[0].plot(
        episode,
        smoothed,
        color="#005f73",
        linewidth=1.8,
        label=f"{args.reward_window}-episode moving average",
    )
    axes[0].set_title("SAC training return")
    axes[0].set_xlabel("Episode")
    axes[0].set_ylabel("Return")
    axes[0].grid(True, alpha=0.25)
    axes[0].legend(loc="lower right")

    stable = metrics["stable_episode_count"]
    axes[1].bar(
        steps_million,
        stable,
        width=0.34,
        color="#0a9396",
        alpha=0.85,
        label="Sustained-standing episodes (out of 5)",
    )
    axes[1].set_ylim(0, 5.4)
    axes[1].set_xlabel("Training steps (millions)")
    axes[1].set_ylabel("Successful episodes")
    axes[1].set_title("Deterministic checkpoint evaluation (seeds 42–46)")
    axes[1].grid(True, axis="y", alpha=0.25)

    height_axis = axes[1].twinx()
    height_axis.plot(
        steps_million,
        metrics["mean_last_100_height_m"],
        color="#ee9b00",
        marker="o",
        markersize=3,
        linewidth=1.2,
        label="Mean final-100 torso height",
    )
    height_axis.axhline(1.2, color="#bb3e03", linestyle="--", linewidth=1, label="1.2 m reference")
    height_axis.set_ylabel("Torso height (m)")

    handles1, labels1 = axes[1].get_legend_handles_labels()
    handles2, labels2 = height_axis.get_legend_handles_labels()
    axes[1].legend(handles1 + handles2, labels1 + labels2, loc="upper left", fontsize=8)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(args.output, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(args.output)


if __name__ == "__main__":
    main()
