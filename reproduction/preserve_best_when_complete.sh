#!/usr/bin/env bash
# Wait for the 25M checkpoint evaluation, then archive the selected policy.
set -euo pipefail

project_dir="/root/autodl-tmp/SACMujoco_HumanoidStandup-v5"
run_dir="$project_dir/reproduction_outputs/formal_seed42"
best_dir="$run_dir/best_model"
final_evaluation="$best_dir/evaluations/25000000_steps.json"
archive_dir="/root/autodl-fs/HumanoidSAC/final_archive_seed42"

while [[ ! -f "$final_evaluation" ]]; do
  printf '%s waiting for final checkpoint evaluation\n' "$(date -Is)"
  sleep 300
done

mkdir -p "$archive_dir/evaluations"
cp -f "$best_dir/best_model.zip" "$archive_dir/best_model.zip"
cp -f "$best_dir/best_model_manifest.json" "$archive_dir/best_model_manifest.json"
cp -f "$best_dir"/evaluations/*_steps.json "$archive_dir/evaluations/"
cp -f "$run_dir/logs/rewards.csv" "$archive_dir/training_rewards.csv"
cp -f "$run_dir/manifest.json" "$archive_dir/training_manifest.json"
if [[ -f "$run_dir/models/sac_humanoid_final.zip" ]]; then
  cp -f "$run_dir/models/sac_humanoid_final.zip" "$archive_dir/final_step_model.zip"
fi

(
  cd "$archive_dir"
  sha256sum best_model.zip best_model_manifest.json training_rewards.csv \
    training_manifest.json > SHA256SUMS.txt
  if [[ -f final_step_model.zip ]]; then
    sha256sum final_step_model.zip >> SHA256SUMS.txt
  fi
)
date -Is > "$archive_dir/ARCHIVE_COMPLETE.txt"
printf 'Archived final selected model to %s\n' "$archive_dir"
