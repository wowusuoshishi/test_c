"""Continuously evaluate periodic checkpoints and preserve the best policy.

This process is deliberately separate from training. It never changes the SAC
model, replay buffer, optimizer, environment, or training process.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import time
from pathlib import Path

import numpy as np
from stable_baselines3 import SAC

from evaluate_checkpoint import run_episode


CHECKPOINT_PATTERN = re.compile(r"sac_humanoid_sac_(\d+)_steps\.zip$")


def checkpoint_step(path: Path) -> int | None:
    match = CHECKPOINT_PATTERN.match(path.name)
    return int(match.group(1)) if match else None


def atomic_json(path: Path, value) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2), encoding="utf-8")
    temporary.replace(path)


def evaluate(checkpoint: Path, episodes: int, seed: int, device: str) -> dict:
    model = SAC.load(checkpoint, device=device)
    episode_results = []
    for offset in range(episodes):
        result, _ = run_episode(model, seed + offset, render=False)
        episode_results.append(result)

    stable_count = sum(
        item["fraction_last_200_above_1_2m"] >= 0.95
        for item in episode_results
    )
    return {
        "checkpoint": str(checkpoint.resolve()),
        "step": checkpoint_step(checkpoint),
        "episodes": episodes,
        "seeds": list(range(seed, seed + episodes)),
        "deterministic": True,
        "stable_episode_count": stable_count,
        "mean_last_100_height_m": float(
            np.mean([item["mean_last_100_height_m"] for item in episode_results])
        ),
        "mean_return": float(np.mean([item["return"] for item in episode_results])),
        "std_return": float(np.std([item["return"] for item in episode_results])),
        "mean_max_torso_height_m": float(
            np.mean([item["max_torso_height_m"] for item in episode_results])
        ),
        "episode_results": episode_results,
    }


def score(result: dict) -> tuple:
    """Prefer sustained standing, then final height, then episode return."""
    return (
        result["stable_episode_count"],
        result["mean_last_100_height_m"],
        result["mean_return"],
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--episodes", type=int, default=5)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--poll-seconds", type=int, default=300)
    parser.add_argument("--final-step", type=int, default=25_000_000)
    parser.add_argument("--device", choices=("cpu", "cuda", "auto"), default="cuda")
    args = parser.parse_args()

    evaluation_dir = args.output_dir / "evaluations"
    evaluation_dir.mkdir(parents=True, exist_ok=True)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    best_manifest_path = args.output_dir / "best_model_manifest.json"
    best_model_path = args.output_dir / "best_model.zip"

    best_result = None
    if best_manifest_path.is_file():
        best_result = json.loads(best_manifest_path.read_text(encoding="utf-8"))

    while True:
        candidates = []
        for path in args.checkpoint_dir.glob("sac_humanoid_sac_*_steps.zip"):
            step = checkpoint_step(path)
            if step is not None:
                candidates.append((step, path))
        candidates.sort()

        for step, checkpoint in candidates:
            evaluation_path = evaluation_dir / f"{step}_steps.json"
            if evaluation_path.is_file():
                result = json.loads(evaluation_path.read_text(encoding="utf-8"))
            else:
                print(f"Evaluating {step} steps: {checkpoint}", flush=True)
                try:
                    result = evaluate(
                        checkpoint, args.episodes, args.seed, args.device
                    )
                except Exception as error:
                    print(f"Evaluation failed for {checkpoint}: {error!r}", flush=True)
                    continue
                atomic_json(evaluation_path, result)
                print(
                    "Result "
                    f"step={step} stable={result['stable_episode_count']}/{args.episodes} "
                    f"last100={result['mean_last_100_height_m']:.6f} "
                    f"return={result['mean_return']:.3f}",
                    flush=True,
                )

            if best_result is None or score(result) > score(best_result):
                temporary_model = args.output_dir / "best_model.zip.tmp"
                shutil.copy2(checkpoint, temporary_model)
                temporary_model.replace(best_model_path)
                best_result = dict(result)
                best_result["selection_rule"] = [
                    "stable_episode_count",
                    "mean_last_100_height_m",
                    "mean_return",
                ]
                best_result["best_model"] = str(best_model_path.resolve())
                atomic_json(best_manifest_path, best_result)
                print(f"NEW BEST: {step} steps, score={score(result)}", flush=True)

        if candidates and candidates[-1][0] >= args.final_step:
            print("Final checkpoint evaluated; monitor complete.", flush=True)
            break
        time.sleep(args.poll_seconds)


if __name__ == "__main__":
    main()
