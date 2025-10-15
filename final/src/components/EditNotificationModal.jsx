const EditNotificationModal = ({
  value,
  onChange,
  onSave,
  onCancel,
  original,
}) => (
  <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-lg flex flex-col items-center relative">
    <button
      className="absolute top-6 right-6 text-gray-400 hover:text-black text-2xl font-bold"
      onClick={onCancel}
      aria-label="Close"
    >
      &times;
    </button>
    <h2 className="text-2xl font-semibold mb-2 text-center">
      Edit notification
    </h2>
    <div className="text-center text-base font-medium mb-6 text-gray-900">
      {original}
    </div>
    <label className="block text-lg font-semibold mb-2 text-left w-full">
      type new notification
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-xl px-4 py-3 w-full mb-8 text-base font-medium"
      placeholder={original}
      // EditNotificationModal component displays a modal for editing notification text
      // Props:
      // - value: string, current notification text
      // - onChange: function, called when input value changes
      // - onSave: function, called when Save button is clicked
      // - onCancel: function, called when Cancel/Close button is clicked
    />
    <div className="flex gap-4 w-full">
      <button
        className="flex-1 bg-black text-white py-3 px-6 rounded-full font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        onClick={onSave}
      >
        save
      </button>
      <button
        className="flex-1 bg-transparent text-gray-700 py-3 px-6 rounded-full font-medium hover:bg-gray-100 transition-colors cursor-pointer border border-slate-300"
        onClick={onCancel}
      >
        go back
      </button>
    </div>
  </div>
);

// EditNotificationModal component displays a modal for editing notification text
// Props:
// - value: string, current notification text
// - onChange: function, called when input value changes
// - onSave: function, called when Save button is clicked
// - onCancel: function, called when Cancel/Close button is clicked
// - original: string, original notification text for placeholder
// Usage: <EditNotificationModal value={...} onChange={...} ... />

export default EditNotificationModal;
