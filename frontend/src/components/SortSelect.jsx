function SortSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="select-control sort-select"
    >
      <option value="latest">Latest First</option>
      <option value="oldest">Oldest First</option>
      <option value="accuracy">Best Accuracy</option>
    </select>
  );
}

export default SortSelect;