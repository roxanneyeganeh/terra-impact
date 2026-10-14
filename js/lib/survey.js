/* ==========================================================================
   Terra survey config — single source of truth for the questions, answers
   and the colour each answer maps to. Used by the generator, the
   "Data-Driven Design" grid on the home page and the About page legend,
   so they can never drift out of sync again.
   ========================================================================== */
(function (global) {
  'use strict';

  const Terra = (global.Terra = global.Terra || {});

  // "seabornedeep" palette (unchanged from the original generator)
  const P = [
    '#e74c3c', // 0  red
    '#3498db', // 1  blue
    '#2ecc71', // 2  green
    '#9b59b6', // 3  purple
    'rgb(241, 196, 15)', // 4 amber
    '#e67e22', // 5  orange
    '#95a5a6', // 6  grey-blue
    'rgb(243, 156, 18)', // 7 golden orange
    '#1abc9c', // 8  teal
    '#7f8c8d', // 9  dark grey
    'rgb(93, 173, 226)', // 10 sky blue
    '#58d68d', // 11 light green
    '#f5b041', // 12 light orange
    'rgb(169, 204, 227)', // 13 soft blue
    'rgb(255, 99, 132)', // 14 coral pink
    'rgb(118, 68, 138)', // 15 plum
  ];
  Terra.PALETTE = P;

  const PLASTIC_BINS = ['0–5', '6–11', '12–16', '17–22', '23–27', '28–33', '34–38', '39–44', '45–49', '50+'];

  /**
   * Each question:
   *  id      – key in the answers object
   *  slot    – which part of the mosaic tile it colours
   *  part    – human name of that part (used in legends / tooltips)
   *  type    – 'choice' | 'range'
   */
  Terra.QUESTIONS = [
    {
      id: 'commute',
      title: 'Which mode of transport do you use most often?',
      short: 'Transport',
      part: 'Centre star',
      slot: 0,
      type: 'choice',
      options: [
        { value: 'drive', label: 'Car', color: P[0] },
        { value: 'public', label: 'Public transport', color: P[1] },
        { value: 'bike', label: 'Bike', color: P[2] },
        { value: 'walk', label: 'Walk', color: P[3] },
      ],
      default: 'drive',
    },
    {
      id: 'recycle',
      title: 'Do you recycle regularly at home?',
      short: 'Recycling',
      part: 'Spikes (A)',
      slot: 1,
      type: 'choice',
      options: [
        { value: 'yes', label: 'Yes', color: P[4] },
        { value: 'no', label: 'No', color: P[7] },
      ],
      default: 'yes',
    },
    {
      id: 'plasticItems',
      title: 'How many single-use plastic items do you use per week?',
      short: 'Single-use plastic',
      part: 'Spikes (B)',
      slot: 2,
      type: 'range',
      min: 0,
      max: 50,
      step: 1,
      default: 5,
      bins: PLASTIC_BINS,
      colors: P.slice(0, 10),
    },
    {
      id: 'energyEfficient',
      title: 'Do you use energy-efficient appliances or light bulbs?',
      short: 'Energy',
      part: 'Outer shapes (A)',
      slot: 3,
      type: 'choice',
      options: [
        { value: 'yes', label: 'Yes', color: P[1] },
        { value: 'no', label: 'No', color: P[6] },
      ],
      default: 'yes',
    },
    {
      id: 'compost',
      title: 'Do you compost your food or garden waste?',
      short: 'Composting',
      part: 'Outer shapes (B)',
      slot: 4,
      type: 'choice',
      options: [
        { value: 'yes', label: 'Yes', color: P[5] },
        { value: 'no', label: 'No', color: P[8] },
      ],
      default: 'yes',
    },
    {
      id: 'excessivePackaging',
      title: 'Do you avoid buying products with excessive packaging?',
      short: 'Packaging',
      part: 'Corners',
      slot: 5,
      type: 'choice',
      options: [
        { value: 'yes', label: 'Yes', color: P[2] },
        { value: 'no', label: 'No', color: P[9] },
      ],
      default: 'yes',
    },
  ];

  Terra.questionBySlot = function (slot) {
    return Terra.QUESTIONS.find((q) => q.slot === slot);
  };

  Terra.defaultAnswers = function () {
    const a = {};
    Terra.QUESTIONS.forEach((q) => (a[q.id] = q.default));
    return a;
  };

  /** Index 0–9 of the plastic bin for a count (same maths as p5's floor(map(n,0,50,0,9))). */
  Terra.plasticBin = function (n) {
    n = Math.max(0, Math.min(50, Number(n) || 0));
    return Math.min(9, Math.floor((n / 50) * 9));
  };

  /** Legend rows for any question: [{label, color}] */
  Terra.legendFor = function (q) {
    if (q.type === 'range') return q.bins.map((label, i) => ({ label, color: q.colors[i] }));
    return q.options.map((o) => ({ label: o.label, color: o.color }));
  };

  /** Turn an answers object into the 6 tile colours (slot order). */
  Terra.colorsFor = function (answers) {
    const a = Object.assign(Terra.defaultAnswers(), answers || {});
    const out = new Array(6);
    Terra.QUESTIONS.forEach((q) => {
      if (q.type === 'range') {
        out[q.slot] = q.colors[Terra.plasticBin(a[q.id])];
      } else {
        const opt = q.options.find((o) => o.value === a[q.id]) || q.options[0];
        out[q.slot] = opt.color;
      }
    });
    return out;
  };
})(window);
