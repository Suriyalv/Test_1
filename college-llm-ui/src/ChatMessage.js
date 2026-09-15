import StructuredResponse from "./StructuredResponse";
import React from "react";
import { BarChart2, Palette, Download, FileText } from "lucide-react";

function ChatMessage({ role, text, type, imageUrl, imageBase64, prompt, generationTime, mermaidCode, diagramType, files }) {

  const downloadImage = () => {
    if (imageBase64) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${imageBase64}`;
      link.download = `generated-${type}-${Date.now()}.png`;
      link.click();
    } else if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  // Handle diagram messages (now just images)
  if (type === 'diagram') {
    return (
      <div className={`message ${role}`}>
        <div className="bubble diagram-bubble">
          <div className="diagram-label flex items-center gap-2"><BarChart2 size={16} /> Generated Diagram</div>
          {prompt && <div className="diagram-prompt-text">Prompt: "{prompt}"</div>}
          <div className="diagram-container">
            {imageBase64 ? (
              <img
                src={`data:image/png;base64,${imageBase64}`}
                alt={prompt || 'Generated diagram'}
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
              />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={prompt || 'Generated diagram'}
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
              />
            ) : mermaidCode ? (
              // Fallback if we just have mermaid code (mock)
              <div style={{ background: 'white', padding: '10px', color: 'black' }}>
                <pre>{mermaidCode}</pre>
                <em style={{ fontSize: '0.8em' }}>(Rendering Simulated)</em>
              </div>
            ) : (
              <div style={{ color: '#888' }}>Loading diagram...</div>
            )}
          </div>
          <div className="diagram-info">
            <span className="diagram-type">{diagramType}</span>
            {generationTime && (
              <span className="generation-time">Generated in {generationTime.toFixed(2)}s</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle image messages
  if (type === 'image') {
    return (
      <div className={`message ${role}`}>
        <div className="bubble image-bubble">
          <div className="image-prompt-label flex items-center gap-2"><Palette size={16} /> Generated Image</div>
          {prompt && <div className="image-prompt-text">Prompt: "{prompt}"</div>}
          <div className="generated-image-container">
            <img
              src={imageBase64 ? `data:image/png;base64,${imageBase64}` : imageUrl}
              alt={prompt || 'Generated image'}
              className="generated-image"
            />
          </div>
          <div className="image-actions">
            <button onClick={downloadImage} className="download-btn flex items-center gap-1.5">
              <Download size={14} /> Download
            </button>
            {generationTime && (
              <span className="generation-time">Generated in {generationTime.toFixed(1)}s</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle text messages (original behavior)
  return (
    <div className={`message ${role}`}>
      <div className="bubble">
        {role === "assistant" ? (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
            <StructuredResponse text={text} />
          </div>
        ) : (
          text
        )}

        {/* Render suggested files if available */}
        {role === "assistant" && files && files.length > 0 && (
          <div className="message-files" style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
            <div style={{ marginBottom: '8px', fontSize: '13px', color: 'black', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> Referenced Question Papers:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {files.map((file, idx) => (
                <a
                  key={idx}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    background: '#f3f4f6',
                    color: 'black',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
                >
                  <span style={{ display: 'flex' }}><FileText size={16} color={file.type === 'pdf' ? '#ef4444' : '#3b82f6'} /></span>
                  {file.name}
                  <span style={{ marginLeft: 'auto', display: 'flex' }}>
                    <Download size={14} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
