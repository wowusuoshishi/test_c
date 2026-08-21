const pptxgen = require('pptxgenjs');
const path = require('path');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'HumanoidStandup SAC reproduction';
pptx.subject = 'SAC for Gymnasium MuJoCo HumanoidStandup-v5';
pptx.title = 'HumanoidStandup-v5 的 Soft Actor-Critic';
pptx.company = 'Assessment project';
pptx.lang = 'zh-CN';
pptx.theme = {
  headFontFace: 'Arial',
  bodyFontFace: 'Arial',
  lang: 'zh-CN',
};
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'CUSTOM_WIDE';

const C = {
  navy: '102A43',
  navy2: '163B5C',
  teal: '00A896',
  mint: '8BE0D4',
  cyan: '4CC9F0',
  orange: 'F4A261',
  gold: 'F6BD60',
  red: 'E76F51',
  ink: '172B4D',
  muted: '52606D',
  pale: 'F5F8FA',
  paleBlue: 'EAF4F7',
  white: 'FFFFFF',
  line: 'D9E2EC',
  darkCard: '1D4668',
};

const W = 13.333;
const H = 7.5;
const margin = 0.55;
const asset = (p) => path.join(__dirname, p);

function addBg(slide, color = C.pale) {
  slide.background = { color };
}

function addTitle(slide, title, kicker = '') {
  slide.addText(title, {
    x: margin, y: 0.38, w: 8.8, h: 0.48,
    fontFace: 'Arial', fontSize: 26, bold: true,
    color: C.ink, margin: 0,
  });
  if (kicker) slide.addText(kicker.toUpperCase(), {
    x: margin, y: 0.12, w: 5, h: 0.18,
    fontFace: 'Arial', fontSize: 8, bold: true,
    color: C.teal, charSpacing: 1.6, margin: 0,
  });
}

function addFooter(slide, n, dark = false) {
  slide.addText(`SAC · HumanoidStandup-v5    ${String(n).padStart(2, '0')}`, {
    x: margin, y: 7.15, w: 4, h: 0.16,
    fontFace: 'Arial', fontSize: 8, color: dark ? 'B9D6E5' : '829AB1', margin: 0,
  });
}

function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: opts.fill || C.white, transparency: opts.transparency || 0 },
    line: { color: opts.line || C.line, transparency: opts.lineTransparency ?? 0, width: opts.lineWidth || 0.8 },
    shadow: opts.shadow ? { type: 'outer', color: '9FB3C8', blur: 1, angle: 45, distance: 1, opacity: 0.16 } : undefined,
  });
}

function pill(slide, text, x, y, w, color = C.teal, textColor = C.white) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.30, rectRadius: 0.12,
    fill: { color }, line: { color, transparency: 100 },
  });
  slide.addText(text, { x, y: y + 0.055, w, h: 0.14, align: 'center', margin: 0, fontFace: 'Arial', fontSize: 9, bold: true, color: textColor });
}

function stat(slide, x, y, w, value, label, color = C.teal, dark = false) {
  card(slide, x, y, w, 1.05, { fill: dark ? C.darkCard : C.white, line: dark ? C.darkCard : C.line, shadow: !dark });
  slide.addText(value, { x: x + 0.16, y: y + 0.17, w: w - 0.32, h: 0.38, fontFace: 'Arial', fontSize: 25, bold: true, color, margin: 0, fit: 'shrink' });
  slide.addText(label, { x: x + 0.16, y: y + 0.65, w: w - 0.32, h: 0.22, fontFace: 'Arial', fontSize: 10, color: dark ? 'D9E2EC' : C.muted, margin: 0, fit: 'shrink' });
}

function arrow(slide, x, y, w, color = C.teal) {
  slide.addShape(pptx.ShapeType.chevron, { x, y, w, h: 0.34, fill: { color }, line: { color, transparency: 100 } });
}

function notes(slide, text) { slide.addNotes(text); }

// 1. Title
{
  const s = pptx.addSlide(); addBg(s, C.navy);
  s.addText('HumanoidStandup-v5 的\nSoft Actor-Critic', { x: 0.72, y: 1.05, w: 7.1, h: 1.35, fontFace: 'Arial', fontSize: 34, bold: true, color: C.white, margin: 0, breakLine: false, fit: 'shrink' });
  s.addText('连续控制 · 最大熵探索 · 可追溯复现', { x: 0.75, y: 2.72, w: 5.9, h: 0.32, fontFace: 'Arial', fontSize: 17, color: C.mint, margin: 0 });
  pill(s, '课程考核项目', 0.75, 0.62, 1.55, C.teal);
  // robot schematic
  card(s, 8.55, 0.92, 3.75, 4.85, { fill: C.navy2, line: C.navy2 });
  s.addShape(pptx.ShapeType.ellipse, { x: 9.87, y: 1.32, w: 1.02, h: 1.02, fill: { color: C.gold }, line: { color: C.gold } });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.32, y: 2.48, w: 2.12, h: 1.55, rectRadius: 0.12, fill: { color: C.cyan }, line: { color: C.cyan } });
  s.addShape(pptx.ShapeType.line, { x: 9.6, y: 4.03, w: -0.45, h: 0.95, line: { color: C.mint, width: 6, beginArrowType: 'none', endArrowType: 'none' } });
  s.addShape(pptx.ShapeType.line, { x: 11.16, y: 4.03, w: 0.45, h: 0.95, line: { color: C.mint, width: 6 } });
  s.addShape(pptx.ShapeType.line, { x: 9.72, y: 2.72, w: -0.88, h: 0.45, line: { color: C.mint, width: 5 } });
  s.addShape(pptx.ShapeType.line, { x: 11.04, y: 2.72, w: 0.88, h: 0.45, line: { color: C.mint, width: 5 } });
  s.addText('MuJoCo\ncontinuous torque', { x: 8.92, y: 5.03, w: 2.95, h: 0.48, fontFace: 'Arial', fontSize: 15, bold: true, align: 'center', color: C.white, margin: 0 });
  stat(s, 0.75, 4.62, 1.65, '348', '默认观测维度', C.cyan, true);
  stat(s, 2.58, 4.62, 1.65, '17', '连续动作维度', C.gold, true);
  stat(s, 4.41, 4.62, 1.65, '25M', '正式训练步数', C.mint, true);
  s.addText('成功视频：artifacts/videos/humanoid_standup_best_18500000_seed43.mp4', { x: 0.75, y: 6.14, w: 7.4, h: 0.2, fontFace: 'Arial', fontSize: 10, bold: true, color: C.gold, margin: 0, fit: 'shrink' });
  s.addText('基于上游仓库固定提交与服务器 manifest 的复现实验', { x: 0.75, y: 6.48, w: 7, h: 0.25, fontFace: 'Arial', fontSize: 11, color: 'B9D6E5', margin: 0 });
  addFooter(s, 1, true); notes(s, '开场先说明任务：让躺在地上的人形机器人用连续关节力矩站起来。强调本次结果来自 AutoDL 服务器，并由 manifest 和 SHA256 校验。');
}

// 2. Environment
{
  const s = pptx.addSlide(); addBg(s); addTitle(s, '任务环境：从躺下到站立', '01 · environment');
  s.addText('HumanoidStandup-v5 的动作是 17 维连续关节力矩。默认观测由位置、速度、惯性、接触力等组成；机器人必须在 MuJoCo 物理约束下完成起身。', { x: margin, y: 1.18, w: 5.75, h: 0.92, fontFace: 'Arial', fontSize: 17, color: C.ink, margin: 0, breakLine: false, fit: 'shrink' });
  stat(s, margin, 2.48, 1.72, '348', 'default obs', C.navy);
  stat(s, 2.48, 2.48, 1.72, '17', 'torque actions', C.teal);
  stat(s, 4.41, 2.48, 1.72, '±0.4', 'action bounds', C.orange);
  card(s, 7.08, 1.16, 5.68, 4.8, { fill: C.paleBlue, line: C.paleBlue });
  const boxes = [
    ['qpos / qvel', '位置与速度'], ['cinert / cvel', '惯性与速度'], ['qfrc_actuator', '执行器力矩'], ['cfrc_ext', '外部接触力'],
  ];
  boxes.forEach((b, i) => {
    const x = 7.48 + (i % 2) * 2.6, y = 1.7 + Math.floor(i / 2) * 1.48;
    card(s, x, y, 2.18, 1.04, { fill: C.white, line: C.line, shadow: true });
    s.addText(b[0], { x: x + 0.14, y: y + 0.22, w: 1.9, h: 0.23, fontFace: 'Arial', fontSize: 13, bold: true, color: C.navy, margin: 0, fit: 'shrink' });
    s.addText(b[1], { x: x + 0.14, y: y + 0.61, w: 1.9, h: 0.18, fontFace: 'Arial', fontSize: 10, color: C.muted, margin: 0 });
  });
  s.addShape(pptx.ShapeType.line, { x: 8.24, y: 4.75, w: 4.0, h: 0, line: { color: C.teal, width: 2, beginArrowType: 'none', endArrowType: 'triangle' } });
  s.addText('任务目标：最后阶段仍保持 torso height ≥ 1.2 m', { x: 7.52, y: 5.16, w: 4.75, h: 0.3, fontFace: 'Arial', fontSize: 13, bold: true, color: C.red, margin: 0, fit: 'shrink' });
  s.addText('本项目为严格复现，上游 wrapper 只把输入截为前 45 个观测值；环境动作和物理仍是 v5。', { x: margin, y: 5.35, w: 5.7, h: 0.54, fontFace: 'Arial', fontSize: 12, color: C.muted, margin: 0, fit: 'shrink' });
  addFooter(s, 2); notes(s, '先区分环境原生空间和策略输入。Gymnasium 默认是 348 维，但上游代码保留了前 45 维；这一步必须在答辩中主动说明。');
}

// 3. RL loop
{
  const s = pptx.addSlide(); addBg(s, C.paleBlue); addTitle(s, '强化学习闭环：策略如何与机器人交互', '02 · rl loop');
  const items = [
    ['sₜ', '观测\n机器人状态', C.navy], ['πθ', 'Actor\n输出动作分布', C.teal], ['aₜ', '17 维力矩\n送进 MuJoCo', C.orange], ['环境', '物理仿真\n更新状态', C.cyan], ['rₜ, sₜ₊₁', '奖励与下一状态\n写入 buffer', C.red],
  ];
  items.forEach((it, i) => {
    const x = 0.65 + i * 2.55;
    card(s, x, 2.0, 1.98, 1.45, { fill: C.white, line: it[2], shadow: true });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.68, y: 1.72, w: 0.62, h: 0.62, fill: { color: it[2] }, line: { color: it[2] } });
    s.addText(it[0], { x: x + 0.71, y: 1.91, w: 0.56, h: 0.16, align: 'center', fontFace: 'Arial', fontSize: 12, bold: true, color: C.white, margin: 0, fit: 'shrink' });
    s.addText(it[1], { x: x + 0.16, y: 2.38, w: 1.65, h: 0.55, align: 'center', fontFace: 'Arial', fontSize: 14, bold: true, color: C.ink, margin: 0, breakLine: false, fit: 'shrink' });
    if (i < items.length - 1) arrow(s, x + 2.04, 2.55, 0.38, C.teal);
  });
  card(s, 2.08, 4.55, 9.18, 1.15, { fill: C.navy, line: C.navy });
  s.addText('Replay buffer', { x: 2.43, y: 4.84, w: 1.7, h: 0.25, fontFace: 'Arial', fontSize: 18, bold: true, color: C.mint, margin: 0 });
  s.addText('(s, a, r, s′, done)  →  随机抽 batch  →  更新 critic / actor / alpha', { x: 4.12, y: 4.86, w: 6.5, h: 0.22, fontFace: 'Arial', fontSize: 15, color: C.white, margin: 0, fit: 'shrink' });
  s.addText('off-policy 的关键：旧数据可以被反复利用，减少昂贵的 MuJoCo 交互次数。', { x: 2.43, y: 5.25, w: 7.5, h: 0.18, fontFace: 'Arial', fontSize: 11, color: 'D9E2EC', margin: 0 });
  addFooter(s, 3); notes(s, '把 SAC 先讲成一个循环：观测进入 actor，动作进入环境，奖励和下一状态进入 replay buffer；训练时再从 buffer 随机取样。');
}

// 4. Objective
{
  const s = pptx.addSlide(); addBg(s, C.navy);
  s.addText('SAC 的核心：奖励之外，还最大化熵', { x: margin, y: 0.58, w: 8.8, h: 0.48, fontFace: 'Arial', fontSize: 28, bold: true, color: C.white, margin: 0 });
  s.addText('03 · maximum entropy objective', { x: margin, y: 0.22, w: 4, h: 0.18, fontFace: 'Arial', fontSize: 8, bold: true, color: C.mint, charSpacing: 1.5, margin: 0 });
  card(s, 0.75, 1.55, 7.2, 2.0, { fill: C.navy2, line: C.navy2 });
  s.addText('J(π) = E [ Σ γᵗ ( rₜ + α H(π(·|sₜ)) ) ]', { x: 1.08, y: 2.08, w: 6.5, h: 0.44, fontFace: 'Cambria', fontSize: 24, bold: true, color: C.gold, margin: 0, fit: 'shrink' });
  s.addText('高奖励       +       高熵（保留探索）', { x: 1.18, y: 2.77, w: 5.95, h: 0.24, fontFace: 'Arial', fontSize: 15, color: C.white, margin: 0, align: 'center' });
  const bars = [
    ['奖励', 0.72, C.orange, '站得高、站得久'],
    ['熵', 0.46, C.cyan, '不要过早锁死'],
  ];
  bars.forEach((b, i) => {
    const y = 4.3 + i * 0.92;
    s.addText(b[0], { x: 0.92, y, w: 0.65, h: 0.2, fontFace: 'Arial', fontSize: 13, bold: true, color: C.white, margin: 0 });
    s.addShape(pptx.ShapeType.roundRect, { x: 1.7, y: y + 0.02, w: 3.85, h: 0.2, rectRadius: 0.08, fill: { color: '274C6B' }, line: { color: '274C6B' } });
    s.addShape(pptx.ShapeType.roundRect, { x: 1.7, y: y + 0.02, w: 3.85 * b[1], h: 0.2, rectRadius: 0.08, fill: { color: b[2] }, line: { color: b[2] } });
    s.addText(b[3], { x: 5.82, y: y - 0.02, w: 2.0, h: 0.23, fontFace: 'Arial', fontSize: 12, color: 'D9E2EC', margin: 0, fit: 'shrink' });
  });
  card(s, 8.58, 1.55, 3.98, 4.78, { fill: C.white, line: C.white });
  s.addText('α 自动调节', { x: 8.98, y: 1.95, w: 2.7, h: 0.3, fontFace: 'Arial', fontSize: 22, bold: true, color: C.navy, margin: 0 });
  s.addText('本项目不是手工固定熵系数，而是让实际策略熵靠近目标熵。', { x: 8.98, y: 2.58, w: 3.0, h: 0.58, fontFace: 'Arial', fontSize: 14, color: C.muted, margin: 0, fit: 'shrink' });
  s.addShape(pptx.ShapeType.ellipse, { x: 9.22, y: 3.64, w: 2.18, h: 2.18, fill: { color: C.paleBlue }, line: { color: C.teal, width: 2 } });
  s.addText('target\nentropy\n= −17', { x: 9.57, y: 4.2, w: 1.48, h: 0.7, align: 'center', fontFace: 'Arial', fontSize: 18, bold: true, color: C.teal, margin: 0, fit: 'shrink' });
  addFooter(s, 4, true); notes(s, '这一页只讲一个公式：SAC 的“soft”来自熵项。对于连续关节控制，熵项能让策略在起身阶段保留探索；alpha 由目标熵自动调节。');
}

// 5. Updates
{
  const s = pptx.addSlide(); addBg(s); addTitle(s, '一次 SAC 更新做了什么？', '04 · update');
  const steps = [
    ['1', '从 buffer 抽样', '(s, a, r, s′, done)', C.navy],
    ['2', '计算 target', 'min(Q₁ᵗ, Q₂ᵗ) − α logπ', C.teal],
    ['3', '更新双 critic', 'MSE(Q₁, y) + MSE(Q₂, y)', C.orange],
    ['4', '更新 actor / α', 'α logπ − min(Q₁,Q₂)', C.red],
  ];
  steps.forEach((it, i) => {
    const x = 0.7 + (i % 2) * 6.15, y = 1.35 + Math.floor(i / 2) * 2.13;
    card(s, x, y, 5.4, 1.55, { fill: C.white, line: C.line, shadow: true });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.27, y: y + 0.33, w: 0.76, h: 0.76, fill: { color: it[3] }, line: { color: it[3] } });
    s.addText(it[0], { x: x + 0.27, y: y + 0.55, w: 0.76, h: 0.18, fontFace: 'Arial', fontSize: 18, bold: true, color: C.white, align: 'center', margin: 0 });
    s.addText(it[1], { x: x + 1.25, y: y + 0.28, w: 3.8, h: 0.26, fontFace: 'Arial', fontSize: 18, bold: true, color: C.ink, margin: 0 });
    s.addText(it[2], { x: x + 1.25, y: y + 0.8, w: 3.8, h: 0.25, fontFace: 'Cambria', fontSize: 14, color: C.muted, margin: 0, fit: 'shrink' });
  });
  card(s, 0.7, 5.78, 11.55, 0.72, { fill: C.paleBlue, line: C.paleBlue });
  s.addText('target critic 软更新： θtarget ← τ θ + (1−τ) θtarget，τ=0.005 让 bootstrap 目标缓慢变化。', { x: 1.0, y: 6.0, w: 10.9, h: 0.22, fontFace: 'Arial', fontSize: 14, bold: true, color: C.navy, margin: 0, fit: 'shrink' });
  addFooter(s, 5); notes(s, '按四步讲更新：抽样、算 target、更新两个 Q、再更新 actor 和 alpha。双 critic 取最小值，target critic 用 tau 做软更新。');
}

// 6. Architecture
{
  const s = pptx.addSlide(); addBg(s, C.paleBlue); addTitle(s, '网络结构：一个随机 Actor，两个 Critic', '05 · architecture');
  card(s, 0.75, 1.18, 2.18, 4.62, { fill: C.white, line: C.line, shadow: true });
  s.addText('观测 s', { x: 1.22, y: 1.55, w: 1.2, h: 0.3, fontFace: 'Arial', fontSize: 21, bold: true, color: C.navy, align: 'center', margin: 0 });
  s.addText('45 维输入\n（上游切片）', { x: 1.05, y: 2.16, w: 1.55, h: 0.55, fontFace: 'Arial', fontSize: 14, color: C.muted, align: 'center', margin: 0, fit: 'shrink' });
  s.addShape(pptx.ShapeType.roundRect, { x: 1.28, y: 3.3, w: 1.1, h: 0.84, rectRadius: 0.08, fill: { color: C.navy }, line: { color: C.navy } });
  s.addText('MLP\n256→256', { x: 1.38, y: 3.56, w: 0.9, h: 0.3, fontFace: 'Arial', fontSize: 13, bold: true, color: C.white, align: 'center', margin: 0 });
  s.addText('s 作为\n两个分支输入', { x: 1.06, y: 4.65, w: 1.55, h: 0.45, fontFace: 'Arial', fontSize: 13, color: C.muted, align: 'center', margin: 0 });
  arrow(s, 3.12, 3.04, 0.46, C.teal);
  card(s, 3.72, 1.18, 3.15, 4.62, { fill: C.white, line: C.teal, shadow: true });
  pill(s, 'Actor πθ', 4.76, 1.56, 1.14, C.teal);
  s.addText('μ(s), log σ(s)', { x: 4.33, y: 2.12, w: 2.0, h: 0.28, fontFace: 'Cambria', fontSize: 19, bold: true, color: C.ink, align: 'center', margin: 0 });
  s.addText('ε ~ N(0,1)\na = tanh(μ+σ ε)\n动作缩放到 [-0.4,0.4]', { x: 4.08, y: 2.88, w: 2.45, h: 1.25, fontFace: 'Arial', fontSize: 15, color: C.muted, align: 'center', margin: 0, fit: 'shrink' });
  s.addShape(pptx.ShapeType.roundRect, { x: 4.54, y: 4.65, w: 1.52, h: 0.6, rectRadius: 0.08, fill: { color: C.orange }, line: { color: C.orange } });
  s.addText('a ∈ R¹⁷', { x: 4.68, y: 4.86, w: 1.24, h: 0.16, fontFace: 'Arial', fontSize: 16, bold: true, color: C.white, align: 'center', margin: 0 });
  arrow(s, 7.07, 3.04, 0.46, C.orange);
  card(s, 7.68, 1.18, 4.88, 4.62, { fill: C.white, line: C.line, shadow: true });
  pill(s, 'Twin critics', 9.39, 1.56, 1.36, C.navy);
  [['Q₁(s,a)', 8.3, C.navy], ['Q₂(s,a)', 10.52, C.red]].forEach((it) => {
    card(s, it[1], 2.35, 1.52, 1.1, { fill: C.paleBlue, line: it[2] });
    s.addText(it[0], { x: it[1] + 0.15, y: 2.7, w: 1.22, h: 0.22, fontFace: 'Cambria', fontSize: 17, bold: true, color: it[2], align: 'center', margin: 0 });
  });
  s.addText('target critics', { x: 9.35, y: 3.82, w: 1.55, h: 0.22, fontFace: 'Arial', fontSize: 14, bold: true, color: C.muted, align: 'center', margin: 0 });
  s.addText('y = r + γ [ min(Q₁ᵗ,Q₂ᵗ) − α logπ ]', { x: 8.15, y: 4.37, w: 4.0, h: 0.3, fontFace: 'Cambria', fontSize: 17, bold: true, color: C.teal, align: 'center', margin: 0, fit: 'shrink' });
  s.addText('min 减少过估计；target 网络只缓慢追踪 online 网络。', { x: 8.23, y: 5.12, w: 3.75, h: 0.26, fontFace: 'Arial', fontSize: 12, color: C.muted, align: 'center', margin: 0, fit: 'shrink' });
  addFooter(s, 6); notes(s, '这里把代码中的 Actor、两个 Q 网络和 target Q 对应起来。重参数化让 actor 可以反向传播通过随机采样。');
}

// 7. Parameters
{
  const s = pptx.addSlide(); addBg(s); addTitle(s, '主要参数：每个数字都对应一个稳定性选择', '06 · parameters');
  const rows = [
    ['total_timesteps', '25,000,000', '训练预算；正式实验步数'],
    ['buffer_size', '1,000,000', '最多保存 transition'],
    ['learning_starts', '10,000', '先收集随机经验'],
    ['batch_size', '256', '每次更新的样本数'],
    ['learning_rate', '3e−4', 'Adam 更新步长'],
    ['gamma / tau', '0.99 / 0.005', '长期回报 / 软更新速度'],
    ['ent_coef / target_entropy', 'auto / −17', '自动探索温度 / 17 维动作'],
    ['train_freq / gradient_steps', '1 / 1', '每步交互做一次更新'],
  ];
  rows.forEach((r, i) => {
    const col = i < 4 ? 0 : 1, row = i % 4;
    const x = 0.75 + col * 6.2, y = 1.32 + row * 1.15;
    card(s, x, y, 5.55, 0.82, { fill: i % 2 ? C.paleBlue : C.white, line: C.line });
    s.addText(r[0], { x: x + 0.18, y: y + 0.16, w: 1.72, h: 0.18, fontFace: 'Arial', fontSize: 12, bold: true, color: C.navy, margin: 0, fit: 'shrink' });
    s.addText(r[1], { x: x + 2.0, y: y + 0.14, w: 1.35, h: 0.22, fontFace: 'Cambria', fontSize: 16, bold: true, color: C.teal, margin: 0, fit: 'shrink' });
    s.addText(r[2], { x: x + 3.45, y: y + 0.16, w: 1.84, h: 0.3, fontFace: 'Arial', fontSize: 11, color: C.muted, margin: 0, fit: 'shrink' });
  });
  s.addText('调参原则：先确认环境/版本和奖励，再调整学习率、熵和训练预算；不要同时改动所有参数。', { x: 0.8, y: 6.2, w: 11.3, h: 0.28, fontFace: 'Arial', fontSize: 14, bold: true, color: C.red, margin: 0, fit: 'shrink' });
  addFooter(s, 7); notes(s, '参数不只是背诵：gamma 决定远期目标，tau 决定 target 稳定性，alpha 决定探索，learning_starts 防止一开始用高度相关的数据更新。');
}

// 8. Comparison
{
  const s = pptx.addSlide(); addBg(s, C.paleBlue); addTitle(s, 'SAC 与其他算法：改进在哪里？', '07 · comparison');
  const cols = [
    ['DQN', '离散动作\nε-greedy\n单 Q', C.muted],
    ['Double-DQN', '离散动作\n分离选/评\n减小过估计', C.navy],
    ['DDPG', '连续动作\n确定性 actor\n外加噪声', C.orange],
    ['TD3', '连续动作\n双 Q + 延迟 actor\n目标策略平滑', C.red],
    ['SAC', '连续动作\n随机 actor\n双 Q + 最大熵 + auto α', C.teal],
  ];
  cols.forEach((c, i) => {
    const x = 0.58 + i * 2.55;
    card(s, x, 1.45, 2.25, 4.55, { fill: C.white, line: c[2], shadow: i === 4 });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.79, y: 1.85, w: 0.68, h: 0.68, fill: { color: c[2] }, line: { color: c[2] } });
    s.addText(String(i + 1), { x: x + 0.79, y: 2.07, w: 0.68, h: 0.16, fontFace: 'Arial', fontSize: 15, bold: true, color: C.white, align: 'center', margin: 0 });
    s.addText(c[0], { x: x + 0.18, y: 2.78, w: 1.88, h: 0.28, fontFace: 'Arial', fontSize: 17, bold: true, color: c[2], align: 'center', margin: 0, fit: 'shrink' });
    s.addText(c[1], { x: x + 0.25, y: 3.45, w: 1.75, h: 1.35, fontFace: 'Arial', fontSize: 14, color: C.ink, align: 'center', margin: 0, breakLine: false, fit: 'shrink' });
    s.addText(i === 4 ? '适合本任务' : '局限', { x: x + 0.55, y: 5.33, w: 1.15, h: 0.19, fontFace: 'Arial', fontSize: 10, bold: true, color: i === 4 ? C.teal : C.muted, align: 'center', margin: 0 });
  });
  s.addText('核心演进：离散 → 连续；单 Q → 双 Q；外加噪声 → 策略内生探索；固定 α → 自动 α。', { x: 0.85, y: 6.38, w: 11.7, h: 0.24, fontFace: 'Arial', fontSize: 14, bold: true, color: C.navy, align: 'center', margin: 0, fit: 'shrink' });
  addFooter(s, 8); notes(s, '把 SAC 的改进拆成四条线：动作空间、Q 过估计、探索方式、熵温度。Double-DQN 的“分离选择与评价”在连续 SAC 中对应 twin critics 的 min。');
}

// 9. Why fits
{
  const s = pptx.addSlide(); addBg(s, C.navy);
  s.addText('为什么 SAC 适合人形站立？', { x: margin, y: 0.58, w: 8.8, h: 0.48, fontFace: 'Arial', fontSize: 28, bold: true, color: C.white, margin: 0 });
  s.addText('08 · design choices', { x: margin, y: 0.22, w: 3, h: 0.18, fontFace: 'Arial', fontSize: 8, bold: true, color: C.mint, charSpacing: 1.5, margin: 0 });
  const cards = [
    ['连续力矩', '17 维动作不能直接枚举，SAC 的高斯 actor 可以直接输出关节力矩。', C.orange],
    ['探索需要', '起身有很多尝试路径，最大熵避免策略太早收敛到“只坐起来”。', C.cyan],
    ['样本昂贵', 'off-policy replay 重复使用 MuJoCo transition，降低真实交互成本。', C.mint],
    ['价值更稳', 'twin Q + target network 抑制过估计和 bootstrap 震荡。', C.gold],
  ];
  cards.forEach((c, i) => {
    const x = 0.75 + (i % 2) * 6.2, y = 1.5 + Math.floor(i / 2) * 2.22;
    card(s, x, y, 5.45, 1.65, { fill: C.navy2, line: C.navy2 });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.35, y: y + 0.42, w: 0.78, h: 0.78, fill: { color: c[2] }, line: { color: c[2] } });
    s.addText(String(i + 1), { x: x + 0.35, y: y + 0.68, w: 0.78, h: 0.18, fontFace: 'Arial', fontSize: 17, bold: true, color: C.navy, align: 'center', margin: 0 });
    s.addText(c[0], { x: x + 1.42, y: y + 0.32, w: 3.45, h: 0.25, fontFace: 'Arial', fontSize: 18, bold: true, color: C.white, margin: 0 });
    s.addText(c[1], { x: x + 1.42, y: y + 0.77, w: 3.55, h: 0.5, fontFace: 'Arial', fontSize: 13, color: 'D9E2EC', margin: 0, fit: 'shrink' });
  });
  s.addText('注意：SAC 不是保证站立的魔法；奖励、观测、版本和评估判据必须同时记录。', { x: 0.9, y: 6.45, w: 11.4, h: 0.22, fontFace: 'Arial', fontSize: 13, bold: true, color: C.gold, align: 'center', margin: 0 });
  addFooter(s, 9, true); notes(s, '这页是算法选择的理由。特别说明“只坐起来”的失败并不一定是代码错误，也可能是探索、奖励和评估判据共同作用的结果。');
}

// 10. Implementation map
{
  const s = pptx.addSlide(); addBg(s); addTitle(s, '代码地图：从训练到最终视频', '09 · implementation');
  const rows = [
    ['训练', 'SAC_train_reproduce.py', '创建环境、SAC、checkpoint、manifest', C.navy],
    ['评估', 'evaluate_checkpoint.py', 'deterministic policy、高度/奖励、MP4', C.teal],
    ['选模', 'best_model_monitor.py', '5 seeds，按稳定站立优先排序', C.orange],
    ['汇总', 'summarize_evaluations.py', 'JSON → CSV + 实验报告', C.red],
    ['绘图', 'plot_reproduction_results.py', '真实日志 → 训练曲线', C.cyan],
  ];
  rows.forEach((r, i) => {
    const y = 1.2 + i * 0.98;
    s.addShape(pptx.ShapeType.ellipse, { x: 0.78, y: y + 0.11, w: 0.48, h: 0.48, fill: { color: r[3] }, line: { color: r[3] } });
    s.addText(String(i + 1), { x: 0.78, y: y + 0.27, w: 0.48, h: 0.14, fontFace: 'Arial', fontSize: 11, bold: true, color: C.white, align: 'center', margin: 0 });
    card(s, 1.55, y, 10.85, 0.68, { fill: i % 2 ? C.paleBlue : C.white, line: C.line });
    s.addText(r[0], { x: 1.82, y: y + 0.2, w: 0.7, h: 0.17, fontFace: 'Arial', fontSize: 13, bold: true, color: r[3], margin: 0 });
    s.addText(r[1], { x: 2.82, y: y + 0.19, w: 3.3, h: 0.2, fontFace: 'Courier New', fontSize: 12, bold: true, color: C.navy, margin: 0, fit: 'shrink' });
    s.addText(r[2], { x: 6.48, y: y + 0.2, w: 5.45, h: 0.18, fontFace: 'Arial', fontSize: 11, color: C.muted, margin: 0, fit: 'shrink' });
  });
  card(s, 2.0, 6.2, 9.4, 0.5, { fill: C.paleBlue, line: C.paleBlue });
  s.addText('CleanRL 作为算法逐行对照；正式模型路径使用上游 SB3 实现，避免把“参考实现”和“实验实现”混为一谈。', { x: 2.25, y: 6.36, w: 8.9, h: 0.16, fontFace: 'Arial', fontSize: 11, bold: true, color: C.navy, align: 'center', margin: 0, fit: 'shrink' });
  addFooter(s, 10); notes(s, '这一页让老师看到代码不是一团黑盒：训练、评估、选模、汇总、绘图各自职责清楚，并且保留了 CleanRL 的算法对照。');
}

// 11. Results
{
  const s = pptx.addSlide(); addBg(s, C.paleBlue); addTitle(s, '真实实验结果：18.5M 是当前最佳检查点', '10 · results');
  const plot = asset('../Results/reproduction_training_summary.png');
  s.addImage({ path: plot, x: 0.65, y: 1.22, w: 7.08, h: 4.95 });
  card(s, 8.15, 1.22, 4.56, 4.95, { fill: C.white, line: C.line, shadow: true });
  s.addText('Best model', { x: 8.55, y: 1.64, w: 2.0, h: 0.25, fontFace: 'Arial', fontSize: 19, bold: true, color: C.teal, margin: 0 });
  s.addText('18,500,000 steps', { x: 8.55, y: 2.05, w: 3.3, h: 0.42, fontFace: 'Arial', fontSize: 25, bold: true, color: C.navy, margin: 0, fit: 'shrink' });
  const stats = [
    ['1.223 m', 'seed43 末 100 步平均高度', C.orange],
    ['400,101', 'seed43 episode return', C.teal],
    ['1.250 m', 'seed43 最大躯干高度', C.navy],
    ['25M', '训练完成步数', C.red],
  ];
  stats.forEach((r, i) => {
    const y = 2.82 + i * 0.68;
    s.addShape(pptx.ShapeType.ellipse, { x: 8.58, y: y + 0.03, w: 0.16, h: 0.16, fill: { color: r[2] }, line: { color: r[2] } });
    s.addText(r[0], { x: 8.9, y, w: 1.28, h: 0.22, fontFace: 'Arial', fontSize: 16, bold: true, color: r[2], margin: 0, fit: 'shrink' });
    s.addText(r[1], { x: 10.3, y: y + 0.02, w: 1.95, h: 0.18, fontFace: 'Arial', fontSize: 11, color: C.muted, margin: 0, fit: 'shrink' });
  });
  s.addText('展示 18.5M checkpoint 的代表性成功回合；选模同时参考回合末高度、奖励和逐回合评估记录。', { x: 8.55, y: 5.55, w: 3.55, h: 0.38, fontFace: 'Arial', fontSize: 12, bold: true, color: C.red, margin: 0, fit: 'shrink' });
  addFooter(s, 11); notes(s, '展示真实仓库曲线和 manifest 的汇总数字。先播放仓库中的 seed43 成功视频，再解释 18.5M 是按逐检查点评估规则保留的最佳 checkpoint。');
}

// 12. Repro and references
{
  const s = pptx.addSlide(); addBg(s, C.navy);
  s.addText('复现清单与参考资料', { x: margin, y: 0.58, w: 8.8, h: 0.48, fontFace: 'Arial', fontSize: 28, bold: true, color: C.white, margin: 0 });
  s.addText('11 · reproducibility', { x: margin, y: 0.22, w: 3, h: 0.18, fontFace: 'Arial', fontSize: 8, bold: true, color: C.mint, charSpacing: 1.5, margin: 0 });
  card(s, 0.75, 1.42, 5.5, 4.72, { fill: C.navy2, line: C.navy2 });
  s.addText('服务器复现命令', { x: 1.12, y: 1.83, w: 3.3, h: 0.28, fontFace: 'Arial', fontSize: 20, bold: true, color: C.mint, margin: 0 });
  s.addText('conda activate humanoid_sac\npython reproduction/SAC_train_reproduce.py \\\n  --total-timesteps 25000000 \\\n  --checkpoint-freq 500000 \\\n  --seed 42 --device cuda', { x: 1.12, y: 2.45, w: 4.5, h: 1.38, fontFace: 'Courier New', fontSize: 13, color: C.white, margin: 0, fit: 'shrink' });
  s.addText('检查：GPU 可用 · MuJoCo 可创建 · manifest 保存 · SHA256 校验 · 5-seed 评估', { x: 1.12, y: 4.68, w: 4.45, h: 0.62, fontFace: 'Arial', fontSize: 13, color: 'D9E2EC', margin: 0, fit: 'shrink' });
  card(s, 6.72, 1.42, 5.84, 4.72, { fill: C.white, line: C.white });
  s.addText('三条核心参考', { x: 7.1, y: 1.83, w: 2.8, h: 0.28, fontFace: 'Arial', fontSize: 20, bold: true, color: C.navy, margin: 0 });
  const refs = [
    ['SAC 论文', '最大熵 actor-critic 与自动温度'],
    ['Gymnasium', 'HumanoidStandup-v5 的空间与任务'],
    ['CleanRL', '连续动作 SAC 的单文件更新逻辑'],
  ];
  refs.forEach((r, i) => {
    const y = 2.55 + i * 0.92;
    s.addShape(pptx.ShapeType.ellipse, { x: 7.12, y: y + 0.04, w: 0.34, h: 0.34, fill: { color: [C.teal, C.orange, C.navy][i] }, line: { color: [C.teal, C.orange, C.navy][i] } });
    s.addText(String(i + 1), { x: 7.12, y: y + 0.14, w: 0.34, h: 0.1, fontFace: 'Arial', fontSize: 9, bold: true, color: C.white, align: 'center', margin: 0 });
    s.addText(r[0], { x: 7.67, y, w: 1.45, h: 0.2, fontFace: 'Arial', fontSize: 15, bold: true, color: C.navy, margin: 0 });
    s.addText(r[1], { x: 9.15, y: y + 0.02, w: 2.9, h: 0.18, fontFace: 'Arial', fontSize: 11, color: C.muted, margin: 0, fit: 'shrink' });
  });
  s.addText('完整链接、参数表、代码解释和限制已写入仓库 docs/。', { x: 7.12, y: 5.38, w: 4.9, h: 0.22, fontFace: 'Arial', fontSize: 13, bold: true, color: C.teal, margin: 0, fit: 'shrink' });
  s.addText('谢谢', { x: 10.75, y: 6.55, w: 1.05, h: 0.34, fontFace: 'Arial', fontSize: 20, bold: true, color: C.gold, align: 'right', margin: 0 });
  addFooter(s, 12, true); notes(s, '结尾给出一条可复现命令和三类参考资料。强调 docs 中明确记录了观测切片、单训练 seed 和最终 best model 的选取规则。');
}

const out = asset('SAC_HumanoidStandup_答辩汇报.pptx');
pptx.writeFile({ fileName: out });
