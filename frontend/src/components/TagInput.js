import React from 'react';
import PropTypes from 'prop-types';
import './TagInput.css'; // optional: for styling if needed

const TagInput = ({ label, name, tags = [], inputValue = '', onChange, placeholder }) => {
  const handleInputChange = (e) => {
    onChange({
      target: {
        name: `_${name}Input`,
        value: e.target.value,
      },
    });
  };

  const handleTagAdd = (tag) => {
    if (tag && !tags.includes(tag)) {
      onChange({
        target: {
          name: name,
          value: [...tags, tag],
        },
      });
    }
    onChange({
      target: {
        name: `_${name}Input`,
        value: '',
      },
    });
  };

  const handleKeyDown = (e) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      const newTag = inputValue.trim().replace(/,$/, '');
      if (newTag) handleTagAdd(newTag);
    }

    if (
      e.key === 'Backspace' &&
      (!inputValue || inputValue.length === 0) &&
      tags.length > 0
    ) {
      const newTags = tags.slice(0, -1);
      onChange({
        target: {
          name: name,
          value: newTags,
        },
      });
    }
  };

  const handleTagRemove = (index) => {
    const newTags = tags.filter((_, i) => i !== index);
    onChange({
      target: {
        name: name,
        value: newTags,
      },
    });
  };

  return (
    <div className="form-group">
      {label && <label htmlFor={`${name}-chips`}>{label}</label>}
      <div
        id={`${name}-chips`}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          border: '1px solid #d1d5db',
          borderRadius: '5px',
          padding: '0.5rem',
        }}
        onClick={() => document.getElementById(`${name}-input-chips`).focus()}
      >
        {tags.map((tag, idx) => (
          <span key={idx} className="tag-chip">
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTagRemove(idx);
              }}
              className="tag-btn"
              aria-label={`Remove ${tag}`}
              tabIndex={0}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          id={`${name}-input-chips`}
          className="tag-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length > 0 ? 'Add more tags' : 'Add a tag'}
          autoComplete="off"
        />
      </div>
      <small
        className="form-helper"
        style={{
          display: 'block',
          color: '#6b7280',
          fontSize: '0.89em',
        }}
      >
        Type to add tags, press Enter or comma to add. Click × to remove a tag.
      </small>
    </div>
  );
};

TagInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string),
  inputValue: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default TagInput;
