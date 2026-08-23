"""Traceable reproduction of the upstream HumanoidStandup-v5 SAC run.

The environment wrapper, initialization and SAC hyperparameters intentionally
match ``Code/SAC_train.py`` at upstream commit 84f8a6443af0c8f476b0e591869473da44d2583a.
Only output paths, total timesteps, checkpoint frequency and the random seed are
made configurable so the run can be executed safely on a remote server.
"""

from __future__ import annotations

import argparse
import csv
import json
import platform
from datetime import datetime, timezone
from pathlib import Path

import gymnasium as gym
import mujoco
import numpy as np
import stable_baselines3
import torch
import torch.nn as nn
from gymnasium import ObservationWrapper
from gymnasium.spaces import Box
from stable_baselines3 import SAC
from stable_baselines3.common.callbacks import (
    BaseCallback,
    CallbackList,
    CheckpointCallback,
)
from stable_baselines3.common.vec_env import DummyVecEnv
from stable_baselines3.sac.policies import Actor


UPSTREAM_COMMIT = "84f8a6443af0c8f476b0e591869473da44d2583a"

# Kept exactly as written by the upstream training script.
Actor.LOG_STD_MIN = -5
Actor.LOG_STD_MAX = 2


class RewardLoggerCallback(BaseCallback):
    """Write the unmodified Gymnasium episode return to CSV."""

    def __init__(self, log_file: Path, verbose: int = 1):
        super().__init__(verbose)
        self.log_file = log_file
        self.episode_rewards = None
        self.episode_counts = None
        with self.log_file.open("w", newline="", encoding="utf-8") as file:
            csv.writer(file).writerow(["Episode", "Reward"])

    def _on_training_start(self) -> None:
        num_envs = self.training_env.num_envs
        self.episode_rewards = [0.0] * num_envs
        self.episode_counts = [0] * num_envs

    def _on_step(self) -> bool:
        rewards = self.locals["rewards"]
        dones = self.locals["dones"]
        for index, done in enumerate(dones):
            self.episode_rewards[index] += float(rewards[index])
            if done:
                self.episode_counts[index] += 1
                episode = self.episode_counts[index]
                episode_return = self.episode_rewards[index]
                print(
                    f"Env {index}, Episode: {episode}, Reward: {episode_return}",
                    flush=True,
                )
                with self.log_file.open("a", newline="", encoding="utf-8") as file:
                    csv.writer(file).writerow([episode, episode_return])
                self.episode_rewards[index] = 0.0
        return True


class TruncatedObservationWrapper(ObservationWrapper):
    """Match upstream: retain only the first 45 observation values."""

    def __init__(self, env):
        super().__init__(env)
        self.original_observation_space = env.observation_space
        low = self.original_observation_space.low[:45]
        high = self.original_observation_space.high[:45]
        self.observation_space = Box(low=low, high=high, dtype=np.float32)

    def observation(self, observation):
        return observation[:45]


def make_env():
    env = gym.make("HumanoidStandup-v5")
    return TruncatedObservationWrapper(env)


def custom_init(module):
    """Match upstream Xavier initialization for every linear layer."""

    if isinstance(module, nn.Linear):
        nn.init.xavier_uniform_(module.weight)
        nn.init.zeros_(module.bias)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--total-timesteps", type=int, default=25_000_000)
    parser.add_argument("--checkpoint-freq", type=int, default=5_000_000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("reproduction_outputs/seed_42"),
    )
    parser.add_argument("--device", choices=("cuda", "cpu", "auto"), default="cuda")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.total_timesteps <= 0:
        raise ValueError("total_timesteps must be positive")
    if args.checkpoint_freq <= 0:
        raise ValueError("checkpoint_freq must be positive")
    if args.device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA was requested but is not available")

    output_dir = args.output_dir.resolve()
    checkpoint_dir = output_dir / "checkpoints"
    model_dir = output_dir / "models"
    tensorboard_dir = output_dir / "tensorboard"
    log_dir = output_dir / "logs"
    for directory in (checkpoint_dir, model_dir, tensorboard_dir, log_dir):
        directory.mkdir(parents=True, exist_ok=True)

    env = DummyVecEnv([make_env])
    checkpoint_callback = CheckpointCallback(
        save_freq=args.checkpoint_freq,
        save_path=str(checkpoint_dir),
        name_prefix="sac_humanoid_sac",
        save_replay_buffer=True,
        save_vecnormalize=True,
    )

    model = SAC(
        "MlpPolicy",
        env,
        learning_rate=3e-4,
        buffer_size=1_000_000,
        learning_starts=10_000,
        batch_size=256,
        train_freq=1,
        gamma=0.99,
        tau=0.005,
        ent_coef="auto",
        gradient_steps=1,
        target_update_interval=1,
        sde_sample_freq=-1,
        target_entropy=-17,
        use_sde_at_warmup=False,
        verbose=1,
        tensorboard_log=str(tensorboard_dir),
        device=args.device,
        seed=args.seed,
    )
    model.policy.apply(custom_init)

    manifest = {
        "started_at_utc": datetime.now(timezone.utc).isoformat(),
        "upstream_commit": UPSTREAM_COMMIT,
        "python": platform.python_version(),
        "gymnasium": gym.__version__,
        "mujoco": mujoco.__version__,
        "stable_baselines3": stable_baselines3.__version__,
        "torch": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "seed": args.seed,
        "total_timesteps": args.total_timesteps,
        "checkpoint_freq": args.checkpoint_freq,
        "environment": "HumanoidStandup-v5",
        "observation_slice": "[:45]",
        "hyperparameters": {
            "learning_rate": 3e-4,
            "buffer_size": 1_000_000,
            "learning_starts": 10_000,
            "batch_size": 256,
            "train_freq": 1,
            "gamma": 0.99,
            "tau": 0.005,
            "ent_coef": "auto",
            "gradient_steps": 1,
            "target_update_interval": 1,
            "sde_sample_freq": -1,
            "target_entropy": -17,
            "use_sde_at_warmup": False,
        },
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )

    reward_callback = RewardLoggerCallback(log_dir / "rewards.csv")
    callbacks = CallbackList([checkpoint_callback, reward_callback])
    try:
        model.learn(total_timesteps=args.total_timesteps, callback=callbacks)
        model.save(model_dir / "sac_humanoid_final")
    finally:
        env.close()

    print(f"Training complete. Outputs: {output_dir}", flush=True)


if __name__ == "__main__":
    main()
