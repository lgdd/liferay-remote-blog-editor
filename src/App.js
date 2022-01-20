import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import BlogEditor from './BlogEditor';

const App = (props) => {
  const [input, setInput] = useState([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);

  const [title, setTitle] = useState('');

  return (
    <div className="container">
      <BlogEditor
        {...props}
        value={input}
        setValue={setInput}
        title={title}
        setTitle={setTitle}
      />
    </div>
  );
};

class BlogEditorElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<div id="blogEditor"></div>';

    const props = {
      siteId: this.getAttribute('siteId'),
    };

    ReactDOM.render(<App {...props} />, document.querySelector('#blogEditor'));
  }
}

if (customElements.get('blog-editor')) {
  console.log('Skipping registration for <blog-editor> (already registered)');
} else {
  customElements.define('blog-editor', BlogEditorElement);
}

export default App;
