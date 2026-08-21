"""Evaluate and record a HumanoidStandup-v5 SAC checkpoint.

The environment and 45-value observation slice match the upstream repository.
Evaluation uses deterministic actions and does not load or modify the replay
buffer, so it is independent from the running training process.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

import cv2
import gymnasium as gym
import numpy as np
from gymnasium import ObservationWrapper
from gymnasium.spaces import Box
from stable_baselines3 import SAC
from stable_baselines3.sac.policies import Actor


Actor.LOG_STD_MIN = -5
Actor.LOG_STD_MAX = 2


class TruncatedObservationWrapper(ObservationWrapper):
    """Retain the first 45 observations, matching the upstream code."""

    def __init__(self, env):
        super().__init__(env)
        self.observation_space = Box(
            low=env.observation_space.low[:45],
            high=env.observation_space.high[:45],
            dtype=np.float32,
        )

    def observation(self, observation):
        return observation[:45]


def make_env(render: bool = False):
    kwargs = {}
    if render:
        kwargs = {"render_mode": "rgb_array", "width": 640, "height": 480}
    return TruncatedObservationWrapper(gym.make("HumanoidStandup-v5", **kwargs))


def run_episode(model: SAC, seed: int, render: bool = False):
    env = make_env(render=render)
    observation, _ = env.reset(seed=seed)
    rewards = []
    heights = []
    frames = []

    terminated = truncated = False
    while not (terminated or truncated):
        action, _ = model.predict(observation, deterministic=True)
        observation, reward, terminated, truncated, _ = env.step(action)
        rewards.append(float(reward))
        # qpos[2] is the absolute vertical torso coordinate used by linup reward.
        heights.append(float(env.unwrapped.data.qpos[2]))
        if render:
            frames.append(env.render())

    env.close()
    height_array = np.asarray(heights, dtype=np.float64)
    last_100 = height_array[-100:]
    last_200 = height_array[-200:]
    result = {
        "seed": seed,
        "steps": len(rewards),
        "return": float(np.sum(rewards)),
        "max_torso_height_m": float(np.max(height_array)),
        "final_torso_height_m": float(height_array[-1]),
        "mean_last_100_height_m": float(np.mean(last_100)),
        "fraction_last_200_above_1_2m": float(np.mean(last_200 >= 1.2)),
        "fraction_episode_above_1_2m": float(np.mean(height_array >= 1.2)),
    }
    return result, frames


def write_video(path: Path, frames, fps: float = 60.0):
    if not frames:
        raise ValueError("No frames were rendered")
    height, width = frames[0].shape[:2]
    writer = cv2.VideoWriter(
        str(path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height)
    )
    if not writer.isOpened():
        raise RuntimeError(f"Unable to open video writer for {path}")
    try:
        for frame in frames:
            writer.write(cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
    finally:
        writer.release()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--episodes", type=int, default=5)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--device", choices=("cpu", "cuda", "auto"), default="cuda")
    args = parser.parse_args()

    if args.episodes <= 0:
        raise ValueError("episodes must be positive")
    if not args.checkpoint.is_file():
        raise FileNotFoundError(args.checkpoint)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    model = SAC.load(args.checkpoint, device=args.device)

    results = []
    for offset in range(args.episodes):
        result, _ = run_episode(model, args.seed + offset, render=False)
        results.append(result)
        print(json.dumps(result, ensure_ascii=False), flush=True)

    csv_path = args.output_dir / "evaluation_episodes.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)

    _, frames = run_episode(model, args.seed, render=True)
    step_match = re.search(r"(\d+)_steps$", args.checkpoint.stem)
    step_label = step_match.group(1) if step_match else "checkpoint"
    video_path = args.output_dir / (
        f"humanoid_standup_{step_label}_steps_seed{args.seed}.mp4"
    )
    write_video(video_path, frames)

    summary = {
        "checkpoint": str(args.checkpoint.resolve()),
        "episodes": args.episodes,
        "deterministic": True,
        "mean_return": float(np.mean([item["return"] for item in results])),
        "std_return": float(np.std([item["return"] for item in results])),
        "mean_max_torso_height_m": float(
            np.mean([item["max_torso_height_m"] for item in results])
        ),
        "mean_last_100_height_m": float(
            np.mean([item["mean_last_100_height_m"] for item in results])
        ),
        "episodes_sustained_above_1_2m_last_200": int(
            sum(item["fraction_last_200_above_1_2m"] >= 0.95 for item in results)
        ),
        "metrics_csv": str(csv_path.resolve()),
        "video": str(video_path.resolve()),
    }
    summary_path = args.output_dir / "evaluation_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
