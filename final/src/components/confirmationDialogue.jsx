// ConfirmationCard component displays a confirmation dialog with customizable message and actions
// Props:
// - message: string, message to display in the dialog
// - confirmText: string, text for the confirm button
// - cancelText: string, text for the cancel button
// - onConfirm: function, called when confirm button is clicked
// - onCancel: function, called when cancel button is clicked
// Usage: <ConfirmationCard message="..." confirmText="..." cancelText="..." onConfirm={...} onCancel={...} />

const ConfirmationCard = ({
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  // Default message if none provided
  const displayMessage = message || "Are you sure you want to proceed?";
  // Default button texts
  const confirmLabel = confirmText || "Yes";
  const cancelLabel = cancelText || "Cancel";

  return (
    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-lg flex justify-center items-center flex-col">
      {/* Confirmation message */}
      <p className="text-gray-900 text-lg font-medium text-center mb-8 leading-relaxed">
        {displayMessage}
      </p>

      {/* Action buttons */}
      <div className="flex gap-4 w-full">
        <button
          className="flex-1 bg-black text-white py-3 px-6 rounded-full font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
        <button
          className="flex-1 bg-transparent text-gray-700 py-3 px-6 rounded-full font-medium hover:bg-gray-100 transition-colors cursor-pointer border border-slate-300"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationCard;
