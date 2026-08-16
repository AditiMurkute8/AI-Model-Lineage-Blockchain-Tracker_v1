export const MODEL_META = {
  "logistic-regression": {
    id: "logistic-regression",
    name: "Logistic Regression",
    shortName: "LR",
    badge: "Binary Classification",
    category: "Linear Classifier",
    description:
      "A simple yet powerful classification algorithm used for binary prediction tasks.",
  },

  "decision-tree": {
    id: "decision-tree",
    name: "Decision Tree",
    shortName: "DT",
    badge: "Rule-Based Learning",
    category: "Tree-Based Model",
    description:
      "A hierarchical model that splits decisions based on feature importance.",
  },

  "random-forest": {
    id: "random-forest",
    name: "Random Forest",
    shortName: "RF",
    badge: "Ensemble Learning",
    category: "Ensemble Tree Model",
    description:
      "An ensemble classifier combining multiple decision trees for stronger predictions.",
  },

  svm: {
    id: "svm",
    name: "Support Vector Machine",
    shortName: "SVM",
    badge: "Margin-Based Classification",
    category: "Hyperplane Classifier",
    description:
      "A powerful classifier that separates classes using an optimal decision boundary.",
  },

  "git-commit-intelligence": {
    id: "git-commit-intelligence",
    name: "Git Commit Intelligence",
    shortName: "GCI",
    badge: "Git Intelligence & Lineage",
    category: "Code Intelligence Classifier (SVM RBF)",
    description:
      "AI-powered Git commit type classification with cryptographic blockchain model lineage tracking.",
  },
};


export function getModelMeta(modelId) {
  return (
    MODEL_META[modelId] || {
      id: "unknown",
      name: "Unknown Model",
      shortName: "AI",
      badge: "AI Workspace",
      category: "Experimental Model",
      description:
        "Model workspace for version tracking and experiment management.",
    }
  );
}