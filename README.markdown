# Annotator
Popover that lets you highlight, add notes and tags to any selected text on a page

*Requires jQuery to be loaded on the page. Autocompletion (for tags) requires awesomplete.js*


![Annotator Screenshot](./annotator-screenshot.png)


##### Getting started

```
    var annotator = Object.create(Annotator);
    annotator.init({
        containerElement: "#book",
        annotations: annotations, // Serialized annotations
        existingTags: tags, // Array of tags
    });

    var editor = Object.create(Editor);
    editor.init({ annotator: annotator });

    annotator.setEditor(editor);
    annotator.startListening();

```

---------------


##### Development
```
npm install
bowser install
```

```
gulp
```

Visit http://localhost:8080/


---------------
**bharanim / [@bharani91](https://twitter.com/bharani91)**
