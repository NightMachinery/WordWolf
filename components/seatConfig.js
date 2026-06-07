export const seatColors = [
  '#E6474E', '#F18E35', '#F5D74C', '#54B877', '#55BFDB',
  '#164186', '#582C71', '#D564D8', '#71362E', '#333333',
  '#B84A62', '#2F7D8C', '#9B7E2D', '#5B8C2F', '#8B5FBF',
  '#C45A2C', '#2C5AC4', '#6A6A6A', '#A33FA3', '#3FA36B',
];

export const seats = seatColors.map((color, index) => ({
  id: `seat${index + 1}`,
  color,
  text: ['#164186', '#582C71', '#71362E', '#333333', '#2C5AC4', '#6A6A6A'].includes(color) ? '#fff' : '#333',
}));
