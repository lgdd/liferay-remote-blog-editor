import React, { useCallback, useMemo } from 'react';
import isHotkey from 'is-hotkey';
import { Editable, withReact, Slate, useSlate } from 'slate-react';
import { createEditor, Editor, Transforms } from 'slate';
import { withHistory } from 'slate-history';
import serialize from './HtmlSerializer';

import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';
import FormatBoldIcon from '@material-ui/icons/FormatBold';
import FormatItalicIcon from '@material-ui/icons/FormatItalic';
import FormatUnderlinedIcon from '@material-ui/icons/FormatUnderlined';
import CodeIcon from '@material-ui/icons/Code';
import LooksOneIcon from '@material-ui/icons/LooksOne';
import LooksTwoIcon from '@material-ui/icons/LooksTwo';
import FormatQuoteIcon from '@material-ui/icons/FormatQuote';
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered';
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import ToggleButton from '@material-ui/lab/ToggleButton';
import Divider from '@material-ui/core/Divider';

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

const initialEditorValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

const BlogEditor = ({ siteId, value, setValue, title, setTitle }) => {
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  return (
    <Container fixed>
      <TextField
        focused
        label="Title"
        color="primary"
        value={title || ''}
        onChange={(e) => {
          setTitle(e.target.value);
        }}
      />
      <Box
        my={2}
        minHeight={200}
        border={1}
        borderColor="grey.500"
        borderRadius={4}
      >
        <Slate
          editor={editor}
          value={value || initialEditorValue}
          onChange={(value) => {
            setValue(value);
          }}
        >
          <Toolbar>
            <MarkButton format="bold">
              <FormatBoldIcon />
            </MarkButton>
            <MarkButton format="italic">
              <FormatItalicIcon />
            </MarkButton>
            <MarkButton format="underline">
              <FormatUnderlinedIcon />
            </MarkButton>
            <MarkButton format="code">
              <CodeIcon />
            </MarkButton>
            <BlockButton format="heading-one">
              <LooksOneIcon />
            </BlockButton>
            <BlockButton format="heading-two">
              <LooksTwoIcon />
            </BlockButton>
            <BlockButton format="block-quote">
              <FormatQuoteIcon />
            </BlockButton>
            <BlockButton format="numbered-list">
              <FormatListNumberedIcon />
            </BlockButton>
            <BlockButton format="bulleted-list">
              <FormatListBulletedIcon />
            </BlockButton>
          </Toolbar>
          <Box pl={1}>
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder="Enter some rich text…"
              spellCheck
              autoFocus
              onKeyDown={(event) => {
                for (const hotkey in HOTKEYS) {
                  if (isHotkey(hotkey, event)) {
                    event.preventDefault();
                    const mark = HOTKEYS[hotkey];
                    toggleMark(editor, mark);
                  }
                }
              }}
            />
          </Box>
        </Slate>
      </Box>
      <Button
        variant="contained"
        color="primary"
        disableElevation
        onClick={() => {
          const htmlBody = value.map((node) => serialize(node)).join('');
          if (typeof window['Liferay'] != 'undefined') {
            siteId =
              siteId == null
                ? window['Liferay'].ThemeDisplay.getSiteGroupId()
                : siteId;
            window['Liferay'].Util.fetch(
              `/o/headless-delivery/v1.0/sites/${siteId}/blog-postings`,
              {
                body: JSON.stringify({
                  headline: title,
                  articleBody: htmlBody,
                }),
                method: `POST`,
                headers: [['content-type', 'application/json']],
              }
            )
              .then((response) => response.json())
              .then((data) => {
                if (data.status) {
                  window['Liferay'].Util.openToast({
                    title: data.status,
                    message: 'Something went wrong creating your blog post',
                    type: 'danger',
                  });
                } else {
                  window['Liferay'].Util.openToast({
                    title: 'Congrats',
                    message: `Your blog post "${data.headline}" is published.`,
                    type: 'success',
                  });
                  setTitle('');
                  Transforms.delete(editor, {
                    at: {
                      anchor: Editor.start(editor, []),
                      focus: Editor.end(editor, []),
                    },
                  });
                  setValue(initialEditorValue);
                }
              })
              .catch((error) => {
                console.error(error);
                window['Liferay'].Util.openToast({
                  message: 'An error occured creating your blog post',
                  type: 'danger',
                });
              });
          }
        }}
      >
        Save
      </Button>
    </Container>
  );
};

export const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>;
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>;
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

export const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const BlockButton = ({ format, children }) => {
  const editor = useSlate();
  return (
    <Box ml={1} mt={1}>
      <ToggleButton
        value={format}
        selected={isBlockActive(editor, format)}
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBlock(editor, format);
        }}
        style={{ lineHeight: 1 }}
      >
        {children}
      </ToggleButton>
    </Box>
  );
};

const MarkButton = ({ format, children }) => {
  const editor = useSlate();
  return (
    <Box ml={1} mt={1}>
      <ToggleButton
        value={format}
        selected={isMarkActive(editor, format)}
        onMouseDown={(event) => {
          event.preventDefault();
          toggleMark(editor, format);
        }}
        style={{ lineHeight: 1 }}
      >
        {children}
      </ToggleButton>
    </Box>
  );
};

const Menu = React.forwardRef(({ children, ...props }, ref) => (
  <>
    <Box
      display="flex"
      direction="row"
      justify="flex-start"
      alignItems="center"
      flexWrap="wrap"
    >
      {children}
    </Box>
    <Box pt={2}>
      <Divider variant="middle" />
    </Box>
  </>
));

const Toolbar = React.forwardRef(({ className, ...props }, ref) => (
  <Menu {...props} ref={ref} />
));

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => n.type === format,
  });
  return !!match;
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) => LIST_TYPES.includes(n.type),
    split: true,
  });

  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  });

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export default BlogEditor;
