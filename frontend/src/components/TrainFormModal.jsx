import { useState } from "react";

function TrainFormModal({ onClose, onSubmit, training }) {
  const [formData, setFormData] = useState({
    experiment_note: "",
    code_change_summary: "",
    code_snippet: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Train New Model Version</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="train-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Experiment Note</label>
            <textarea
              name="experiment_note"
              value={formData.experiment_note}
              onChange={handleChange}
              placeholder="Describe what you changed in this experiment..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Code Change Summary</label>
            <textarea
              name="code_change_summary"
              value={formData.code_change_summary}
              onChange={handleChange}
              placeholder="Summarize code modifications..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Code Snippet</label>
            <textarea
              name="code_snippet"
              value={formData.code_snippet}
              onChange={handleChange}
              placeholder="Paste relevant code snippet here..."
              rows="6"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="primary-button" disabled={training}>
              {training ? "Training..." : "Train Version"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TrainFormModal;