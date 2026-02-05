import { useState } from 'react';

export default function SectionExplainer({ text, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="section-explainer">
      <button
        className="explainer-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {open ? 'Hide explanation' : 'How to use this data'}
      </button>
      {open && (children ? <div className="explainer-text">{children}</div> : <p className="explainer-text">{text}</p>)}
    </div>
  );
}
