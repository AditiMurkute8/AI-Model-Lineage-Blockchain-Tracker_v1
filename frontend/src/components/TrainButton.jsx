function TrainButton({ onTrainClick }) {
  return (
    <div className="train-button-wrapper">
      <button className="train-button" onClick={onTrainClick}>
        Train New Version
      </button>
    </div>
  );
}

export default TrainButton;