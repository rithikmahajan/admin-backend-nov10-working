import React, { useState, useCallback, memo, useMemo, useRef } from "react";
import {
  Plus,
  Upload,
  X,
  Edit2,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Type,
  Palette,
  Save,
  Send,
} from "lucide-react";

const DEFAULT_TEMPLATE = Object.freeze({
  id: null,
  name: "",
  content: Object.freeze({
    images: Object.freeze([]),
    texts: Object.freeze([]),
    layout: "default",
  }),
  preview: "",
  createdAt: new Date(),
  updatedAt: new Date(),
});

const SAMPLE_TEMPLATES = Object.freeze([
  Object.freeze({
    id: 1,
    name: "Promotional Offer",
    content: Object.freeze({
      backgroundColor: "#000000",
      texts: Object.freeze([
        Object.freeze({
          id: "text1",
          content: "WANT",
          fontSize: "12px",
          color: "#ffffff",
          position: Object.freeze({ x: 50, y: 20 }),
        }),
        Object.freeze({
          id: "text2",
          content: "10% OFF",
          fontSize: "64px",
          color: "#ffffff",
          position: Object.freeze({ x: 50, y: 40 }),
        }),
        Object.freeze({
          id: "text3",
          content: "YOUR NEXT PURCHASE?",
          fontSize: "20px",
          color: "#ffffff",
          position: Object.freeze({ x: 50, y: 60 }),
        }),
        Object.freeze({
          id: "text4",
          content: "PLUS REWARD GIVEAWAY AND MORE!",
          fontSize: "12px",
          color: "#ffffff",
          position: Object.freeze({ x: 50, y: 75 }),
        }),
        Object.freeze({
          id: "text5",
          content: "What are you waiting for?",
          fontSize: "12px",
          color: "#ffffff",
          position: Object.freeze({ x: 50, y: 85 }),
        }),
        Object.freeze({
          id: "text6",
          content: "Become a Rewards member today!",
          fontSize: "12px",
          color: "#ffffff",
          position: Object.freeze({ x: 50, y: 92 }),
        }),
      ]),
      images: Object.freeze([]),
    }),
    preview: "#000000",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  }),
  Object.freeze({
    id: 2,
    name: "Concert Giveaway",
    content: Object.freeze({
      backgroundColor: "#fffb25",
      texts: Object.freeze([
        Object.freeze({
          id: "text1",
          content: "Expires in 8 days",
          fontSize: "12px",
          color: "#000000",
          position: Object.freeze({ x: 50, y: 10 }),
        }),
        Object.freeze({
          id: "text2",
          content: "YORAA Concert Giveaways",
          fontSize: "14px",
          color: "#000000",
          position: Object.freeze({ x: 50, y: 25 }),
        }),
        Object.freeze({
          id: "text3",
          content: "MEMBERS EXCLUSIVE",
          fontSize: "12px",
          color: "#000000",
          position: Object.freeze({ x: 50, y: 85 }),
        }),
      ]),
      images: Object.freeze([]),
    }),
    preview: "#fffb25",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-12"),
  }),
]);

const BASIC_TOOLS = Object.freeze([
  Object.freeze({ id: "bold", icon: Bold, label: "Bold" }),
  Object.freeze({ id: "italic", icon: Italic, label: "Italic" }),
  Object.freeze({ id: "underline", icon: Underline, label: "Underline" }),
  Object.freeze({ id: "align-left", icon: AlignLeft, label: "Align Left" }),
  Object.freeze({
    id: "align-center",
    icon: AlignCenter,
    label: "Align Center",
  }),
  Object.freeze({ id: "align-right", icon: AlignRight, label: "Align Right" }),
]);

const ADVANCED_TOOLS = Object.freeze([
  Object.freeze({ id: "text-color", icon: Palette, label: "Text Color" }),
  Object.freeze({
    id: "background-color",
    icon: Palette,
    label: "Background Color",
  }),
  Object.freeze({ id: "font-size", icon: Type, label: "Font Size" }),
  Object.freeze({ id: "font-family", icon: Type, label: "Font Family" }),
]);

const useTemplateEditor = () => {
  const [currentTemplate, setCurrentTemplate] = useState(() => ({
    ...DEFAULT_TEMPLATE,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const [savedTemplates, setSavedTemplates] = useState(SAMPLE_TEMPLATES);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);

  const updateTemplate = useCallback((updates) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  }, []);

  const addText = useCallback((text) => {
    const newText = {
      id: `text_${Date.now()}`,
      content: text,
      fontSize: "16px",
      color: "#000000",
      position: { x: 50, y: 50 },
      style: {
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        textAlign: "left",
      },
    };

    setCurrentTemplate((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        texts: [...(prev.content.texts || []), newText],
      },
      updatedAt: new Date(),
    }));
  }, []);

  const addImage = useCallback((imageFile) => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newImage = {
        id: `image_${Date.now()}`,
        src: e.target.result,
        position: { x: 20, y: 20 },
        size: { width: 100, height: 100 },
      };

      setCurrentTemplate((prev) => ({
        ...prev,
        content: {
          ...prev.content,
          images: [...(prev.content.images || []), newImage],
        },
        updatedAt: new Date(),
      }));
    };
    reader.readAsDataURL(imageFile);
  }, []);

  const saveTemplate = useCallback(() => {
    if (!currentTemplate.name.trim()) {
      alert("Please enter a template name");
      return;
    }

    setSavedTemplates((prev) => {
      const templateToSave = {
        ...currentTemplate,
        id: currentTemplate.id || Date.now(),
        updatedAt: new Date(),
      };

      const existingIndex = prev.findIndex((t) => t.id === templateToSave.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = templateToSave;
        return updated;
      }
      return [...prev, templateToSave];
    });

    alert("Template saved successfully!");
    setIsEditing(false);
  }, [currentTemplate]);

  const deleteTemplate = useCallback((templateId) => {
    setSavedTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }, []);

  const editTemplate = useCallback((template) => {
    setCurrentTemplate(template);
    setIsEditing(true);
    setSelectedElement(null);
  }, []);

  return {
    currentTemplate,
    setCurrentTemplate,
    savedTemplates,
    isEditing,
    setIsEditing,
    draggedElement,
    setDraggedElement,
    selectedElement,
    setSelectedElement,
    updateTemplate,
    addText,
    addImage,
    saveTemplate,
    deleteTemplate,
    editTemplate,
  };
};

const useDragAndDrop = () => {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e, element) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e, onPositionChange) => {
      if (!isDragging) return;

      const container = e.currentTarget.closest(".template-preview");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const x =
        ((e.clientX - containerRect.left - dragOffset.current.x) /
          containerRect.width) *
        100;
      const y =
        ((e.clientY - containerRect.top - dragOffset.current.y) /
          containerRect.height) *
        100;

      onPositionChange({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};

const ImageUploadSection = memo(({ onImageUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        onImageUpload(file);
      }
    },
    [onImageUpload]
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Image</h3>

        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:border-blue-300 transition-colors duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
              <ImageIcon className="h-10 w-10 text-gray-400" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={triggerFileInput}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-colors duration-200 shadow-md"
            >
              <Plus className="w-5 h-5" />
              Upload Image
            </button>

            <p className="text-sm text-gray-500 mt-3">
              Drop your image here or click to browse
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

ImageUploadSection.displayName = "ImageUploadSection";

const TextInputSection = memo(({ onTextAdd }) => {
  const [inputText, setInputText] = useState("");

  const handleAddText = useCallback(() => {
    if (inputText.trim()) {
      onTextAdd(inputText);
      setInputText("");
    }
  }, [inputText, onTextAdd]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleAddText();
      }
    },
    [handleAddText]
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Input Text</h3>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your text here..."
            className="w-full h-80 p-4 border-none outline-none resize-none text-gray-700 placeholder-gray-400 focus:ring-0"
          />
        </div>

        <button
          onClick={handleAddText}
          disabled={!inputText.trim()}
          className="w-full mt-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white px-4 py-3 rounded-xl font-medium transition-colors duration-200"
        >
          Add Text
        </button>
      </div>
    </div>
  );
});

TextInputSection.displayName = "TextInputSection";

const TemplatePreview = memo(
  ({ template, onElementSelect, selectedElement, onPositionUpdate }) => {
    const { handleMouseDown, handleMouseMove, handleMouseUp } =
      useDragAndDrop();

    const updateElementPosition = useCallback(
      (elementId, newPosition) => {
        onPositionUpdate(elementId, newPosition);
      },
      [onPositionUpdate]
    );

    const hasNoContent = useMemo(
      () =>
        !template.content?.texts?.length && !template.content?.images?.length,
      [template.content?.texts?.length, template.content?.images?.length]
    );

    const backgroundColor = useMemo(
      () => template.content?.backgroundColor || "#000000",
      [template.content?.backgroundColor]
    );

    const renderedImages = useMemo(
      () =>
        template.content?.images?.map((image) => (
          <div
            key={image.id}
            className={`absolute cursor-move transition-all duration-200 ${
              selectedElement?.id === image.id
                ? "ring-2 ring-blue-500 ring-offset-2"
                : ""
            }`}
            style={{
              left: `${image.position.x}%`,
              top: `${image.position.y}%`,
              width: `${image.size.width}px`,
              height: `${image.size.height}px`,
            }}
            onMouseDown={(e) => {
              onElementSelect(image);
              handleMouseDown(e, image);
            }}
          >
            <img
              src={image.src}
              alt="Template"
              className="w-full h-full object-cover rounded-lg shadow-sm"
              draggable={false}
            />
          </div>
        )) || [],
      [
        template.content?.images,
        selectedElement?.id,
        onElementSelect,
        handleMouseDown,
      ]
    );

    const renderedTexts = useMemo(
      () =>
        template.content?.texts?.map((text) => (
          <div
            key={text.id}
            className={`absolute cursor-move transition-all duration-200 ${
              selectedElement?.id === text.id
                ? "ring-2 ring-blue-500 ring-offset-2 rounded"
                : ""
            }`}
            style={{
              left: `${text.position.x}%`,
              top: `${text.position.y}%`,
              transform: "translate(-50%, -50%)",
              fontSize: text.fontSize,
              color: text.color,
              fontWeight: text.style?.fontWeight || "normal",
              fontStyle: text.style?.fontStyle || "normal",
              textDecoration: text.style?.textDecoration || "none",
              textAlign: text.style?.textAlign || "left",
              fontFamily: "Montserrat, sans-serif",
            }}
            onMouseDown={(e) => {
              onElementSelect(text);
              handleMouseDown(e, text);
            }}
          >
            {text.content}
          </div>
        )) || [],
      [
        template.content?.texts,
        selectedElement?.id,
        onElementSelect,
        handleMouseDown,
      ]
    );

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Email Template Preview
          </h3>

          <div className="bg-gray-50 p-4 rounded-xl">
            <div
              className="template-preview relative mx-auto rounded-lg overflow-hidden cursor-crosshair border border-gray-200 shadow-inner"
              style={{ backgroundColor, width: "320px", height: "480px" }}
              onMouseMove={(e) =>
                handleMouseMove(e, (pos) => {
                  if (selectedElement) {
                    updateElementPosition(selectedElement.id, pos);
                  }
                })
              }
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {renderedImages}
              {renderedTexts}

              {hasNoContent && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-center font-['Montserrat'] leading-none">
                  <div className="tracking-[-0.3px] px-4">
                    <p className="text-[12px] mb-0 block opacity-90">WANT</p>
                    <p className="text-[48px] mb-0 block font-bold">10% OFF</p>
                    <p className="text-[16px] mb-0 block">
                      YOUR NEXT PURCHASE?
                    </p>
                    <p className="text-[10px] mb-0 block opacity-80">
                      PLUS REWARD GIVEAWAY AND MORE!
                    </p>
                    <p className="text-[10px] mb-0 block">&nbsp;</p>
                    <p className="text-[10px] mb-0 block opacity-80">
                      What are you waiting for?
                    </p>
                    <p className="text-[10px] block opacity-80">
                      Become a Rewards member today!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TemplatePreview.displayName = "TemplatePreview";

const BasicEditingTools = memo(({ onToolApply, selectedElement }) => {
  const isDisabled = useMemo(() => !selectedElement, [selectedElement]);

  const renderedTools = useMemo(
    () =>
      BASIC_TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolApply(tool.id, selectedElement.id)}
          className="p-3 hover:bg-blue-50 rounded-xl transition-colors duration-200 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title={tool.label}
          disabled={isDisabled}
        >
          <tool.icon className="w-5 h-5 text-gray-700" />
        </button>
      )),
    [onToolApply, selectedElement?.id, isDisabled]
  );

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg">
      <div className="p-6">
        <h4 className="text-xl font-bold text-gray-900 mb-4">
          Basic Editing Tools
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-gray-600 font-medium">
            {isDisabled ? "Select an element to edit" : "Edit selected element"}
          </span>
          <div className="flex gap-2 ml-auto">{renderedTools}</div>
        </div>
      </div>
    </div>
  );
});

BasicEditingTools.displayName = "BasicEditingTools";

const AdvancedEditingTools = memo(({ onToolApply, selectedElement }) => {
  const isDisabled = useMemo(() => !selectedElement, [selectedElement]);

  const renderedTools = useMemo(
    () =>
      ADVANCED_TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolApply(tool.id, selectedElement.id)}
          className="p-3 hover:bg-blue-50 rounded-xl transition-colors duration-200 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title={tool.label}
          disabled={isDisabled}
        >
          <tool.icon className="w-5 h-5 text-gray-700" />
        </button>
      )),
    [onToolApply, selectedElement?.id, isDisabled]
  );

  return (
    <div className="mt-6 bg-white border border-gray-100 rounded-2xl shadow-lg">
      <div className="p-6">
        <h4 className="text-xl font-bold text-gray-900 mb-4">
          Advanced Editing Tools
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-gray-600 font-medium">
            Style and formatting options
          </span>
          <div className="flex gap-2 ml-auto">{renderedTools}</div>
        </div>
      </div>
    </div>
  );
});

AdvancedEditingTools.displayName = "AdvancedEditingTools";

const SavedTemplatesSection = memo(
  ({ templates, onEdit, onDelete, onSend }) => {
    const templateCount = useMemo(() => templates.length, [templates.length]);

    const renderedTemplates = useMemo(
      () =>
        templates.map((template) => (
          <TemplateRow
            key={template.id}
            template={template}
            onEdit={onEdit}
            onDelete={onDelete}
            onSend={onSend}
          />
        )),
      [templates, onEdit, onDelete, onSend]
    );

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Saved Templates
              </h3>
              <p className="text-gray-600 mt-1">
                {templateCount} templates saved
              </p>
            </div>
            <div className="text-sm text-gray-500 font-medium">Actions</div>
          </div>

          <div className="space-y-6">
            {renderedTemplates}
            {templateCount === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No templates saved yet</p>
                <p className="text-gray-400">
                  Create your first template to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

const TemplateRow = memo(({ template, onEdit, onDelete, onSend }) => {
  const handleSend = useCallback(
    () => onSend(template.id),
    [onSend, template.id]
  );
  const handleEdit = useCallback(() => onEdit(template), [onEdit, template]);
  const handleDelete = useCallback(
    () => onDelete(template.id),
    [onDelete, template.id]
  );

  const backgroundColor = useMemo(
    () => template.content?.backgroundColor || "#000000",
    [template.content?.backgroundColor]
  );

  const renderedTexts = useMemo(
    () =>
      template.content?.texts?.map((text) => (
        <div
          key={text.id}
          className="absolute font-['Montserrat'] leading-none tracking-[-0.3px]"
          style={{
            left: `${text.position.x}%`,
            top: `${text.position.y}%`,
            transform: "translate(-50%, -50%)",
            fontSize: text.fontSize,
            color: text.color,
          }}
        >
          {text.content}
        </div>
      )) || [],
    [template.content?.texts]
  );

  const renderedImages = useMemo(
    () =>
      template.content?.images?.map((image) => (
        <div
          key={image.id}
          className="absolute"
          style={{
            left: `${image.position.x}%`,
            top: `${image.position.y}%`,
            width: `${image.size.width}px`,
            height: `${image.size.height}px`,
          }}
        >
          <img
            src={image.src}
            alt="Template"
            className="w-full h-full object-cover rounded"
          />
        </div>
      )) || [],
    [template.content?.images]
  );

  return (
    <div className="flex items-center gap-6 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors duration-200">
      <div
        className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
        style={{ backgroundColor, width: "120px", height: "160px" }}
      >
        <div className="relative h-full">
          {renderedTexts}
          {renderedImages}
        </div>
      </div>

      <div className="flex-1">
        <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
        <p className="text-sm text-gray-500 mt-1">
          Created {template.createdAt.toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSend}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
        >
          Send Now
        </button>

        <button
          onClick={handleEdit}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="Edit Template"
        >
          <Edit2 className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={handleDelete}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
          title="Delete Template"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>
    </div>
  );
});

TemplateRow.displayName = "TemplateRow";

SavedTemplatesSection.displayName = "SavedTemplatesSection";

const TemplateNameInput = memo(({ value, onChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Template Name
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter template name..."
        className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
      />
    </div>
  );
});

TemplateNameInput.displayName = "TemplateNameInput";

const EmailAndSmsTemplateManagementScreenPage = () => {
  const {
    currentTemplate,
    setCurrentTemplate,
    savedTemplates,
    isEditing,
    setIsEditing,
    selectedElement,
    setSelectedElement,
    updateTemplate,
    addText,
    addImage,
    saveTemplate,
    deleteTemplate,
    editTemplate,
  } = useTemplateEditor();

  const handleNewTemplate = useCallback(() => {
    setCurrentTemplate({
      ...DEFAULT_TEMPLATE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setIsEditing(true);
    setSelectedElement(null);
  }, [setCurrentTemplate, setIsEditing, setSelectedElement]);

  const handleSave = useCallback(() => {
    saveTemplate();
  }, [saveTemplate]);

  const handleSendTemplate = useCallback((templateId) => {
    alert(`Sending template ${templateId}...`);
  }, []);

  const handleToolApply = useCallback((toolId, elementId) => {
    console.log(`Applying tool ${toolId} to element ${elementId}`);
  }, []);

  const handlePositionUpdate = useCallback((elementId, newPosition) => {
    setCurrentTemplate((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        texts:
          prev.content?.texts?.map((text) =>
            text.id === elementId ? { ...text, position: newPosition } : text
          ) || [],
        images:
          prev.content?.images?.map((image) =>
            image.id === elementId ? { ...image, position: newPosition } : image
          ) || [],
      },
      updatedAt: new Date(),
    }));
  }, []);

  const handleTemplateNameChange = useCallback(
    (name) => {
      updateTemplate({ name });
    },
    [updateTemplate]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Email & SMS Templates
          </h1>
          <p className="text-gray-600 text-lg">
            Create and manage your marketing templates
          </p>
        </div>

        {isEditing && (
          <div className="mb-12">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 mb-8">
              <TemplateNameInput
                value={currentTemplate.name}
                onChange={handleTemplateNameChange}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <ImageUploadSection onImageUpload={addImage} />
                  <TextInputSection onTextAdd={addText} />
                </div>

                <div className="lg:col-span-2">
                  <TemplatePreview
                    template={currentTemplate}
                    onElementSelect={setSelectedElement}
                    selectedElement={selectedElement}
                    onPositionUpdate={handlePositionUpdate}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSave}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors duration-200 shadow-md"
                >
                  <Save className="w-5 h-5" />
                  Save Template
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <BasicEditingTools
                onToolApply={handleToolApply}
                selectedElement={selectedElement}
              />

              <AdvancedEditingTools
                onToolApply={handleToolApply}
                selectedElement={selectedElement}
              />
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="mb-8">
            <button
              onClick={handleNewTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors duration-200 shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create New Template
            </button>
          </div>
        )}

        <SavedTemplatesSection
          templates={savedTemplates}
          onEdit={editTemplate}
          onDelete={deleteTemplate}
          onSend={handleSendTemplate}
        />
      </div>
    </div>
  );
};

export default EmailAndSmsTemplateManagementScreenPage;
