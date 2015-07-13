var Annotation = (function Annotation() {

    var Annotation = {
        annotator: null,
        // Range that we got from the current selection
        _selectedRange: null,

        range: {
            startContainerXPath: null,
            endContainerXPath: null,
            parentContainerXPath: null,
            startOffset: null,
            endOffset: null
        },
        id: null,
        selectedText: null,
        color: null,
        note: null,
        tags: [],

        init: function(obj) {
            if(!obj) return;

            if(obj.annotator) {
                this.annotator = obj.annotator;
            }
            if(obj.selectedRange) {
                this.saveSelection(obj.selectedRange);
            } else if(obj.savedAnnotation) {
                var savedAnnotation = obj.savedAnnotation;
                this.range          = savedAnnotation.range;
                this.id             = savedAnnotation.id;
                this.selectedText   = savedAnnotation.selectedText;
                this.color          = savedAnnotation.color;
                this.note           = savedAnnotation.note;
                this.tags           = savedAnnotation.tags;
            }

        },

        render: function(opts) {
            if(opts && opts.temporary) {
                this.wrapNodes(true);
            } else if(opts && opts.convert) {
                this.convertFromTemporary();
            } else if(opts && opts.update) {
                this.updateAnnotation();
            } else {
                this.wrapNodes();
            }
        },

        updateAnnotation: function() {
            var $parentContainer = $(this.annotator.findElementByXPath(this.range.parentContainerXPath));
 
            var renderedAnnotation = $parentContainer
                                        .find(".annotation[data-id='" + this.id + "']");

            renderedAnnotation.removeClass("annotation");

            renderedAnnotation
                .removeAttr("class")
                .addClass("annotation")
                .addClass(this.color)
                .removeAttr("style");
        },

        saveSelection: function(range) {
            var parentContainer = range.commonAncestorContainer;
            var startContainer = range.startContainer;
            var endContainer = range.endContainer;

            var startOffset = range.startOffset;
            var endOffset = range.endOffset;

            var parentNode = this.getParentNodeFor(parentContainer);
            var startNode = this.getParentNodeFor(startContainer);
            var endNode = this.getParentNodeFor(endContainer);

            var nodesBetweenStart = this.getNodesToWrap(parentNode, startNode.firstChild, startContainer);
            var nodesBetweenEnd = this.getNodesToWrap(parentNode, endNode.firstChild, endContainer);

            void 0;

            if(nodesBetweenStart.length) {
                for(var i = 0; i < nodesBetweenStart.length; i++) {
                    var characterLength = nodesBetweenStart[i].nodeValue.length;
                    startOffset += characterLength;
                    // endOffset += characterLength;
                }
            }

            if(nodesBetweenEnd.length) {
                for(var i = 0; i < nodesBetweenEnd.length; i++) {
                    endOffset += nodesBetweenEnd[i].nodeValue.length;
                }
            }

            var selectedContent = this.getSelectionContent(range);


            // clone this for easily wrapping children
            // without having to go through the full circle of
            // looking up by xpath
            this._selectedRange = range.cloneRange();


            // store range properties because
            // we need it when we save this annotation
            // to server
            this.range = {
                startContainerXPath: this.annotator.createXPathFromElement(startNode),
                endContainerXPath: this.annotator.createXPathFromElement(endNode),
                parentContainerXPath: this.annotator.createXPathFromElement(parentNode),
                startOffset: startOffset,
                endOffset: endOffset,
            };

            this.id = this.generateRandomID();
            this.selectedText = selectedContent;
        },

        getSelectionContent: function(range) {
            var container = document.createElement("div");
            container.appendChild(range.cloneContents());
            var text = container.textContent;
            return text;
        },

        getParentNodeFor: function(node) {

            while(node.nodeType != 1) {
                node = node.parentNode;
            }

            return node;
        },

        generateRandomID: function() {
            return 'annotation-' + new Date().getTime();
        },

        save: function(obj) {
            if(!obj) return;

            this.color = obj.color;

            if(obj.note)
                this.note = obj.note;

            if(obj.tags && obj.tags.length) {
                this.tags = obj.tags
            }

            var data = this.serialize();

            if(obj && obj.debug) {
                void 0;
            } else {
                this.postToRemote();
            }

            if(obj && obj.cbk) obj.cbk(this);

        },

        destroy: function(cbk) {
            void 0;
            if(cbk) cbk();
        },

        postToRemote: function() {
            // TODO
            void 0;
        },

        serialize: function() {
            var range = this.range;
            return {
                 range: {
                    startOffset: range.startOffset,
                    endOffset: range.endOffset,
                    startContainerXPath: range.startContainerXPath,
                    endContainerXPath: range.endContainerXPath,
                    parentContainerXPath: range.parentContainerXPath
                },
                id:  this.id,
                selectedText: this.selectedText,
                color: this.color,
                note: this.note,
                tags: this.tags
            }
        },

        getContainedNodes: function() {
            var range, startContainer, endContainer, parentContainer, startOffset, endOffset;
            var nodes = [];

            if(this._selectedRange) {
                range = this._selectedRange;
                parentContainer = range.commonAncestorContainer;
                startContainer = range.startContainer;
                endContainer = range.endContainer
            } else {
                range = this.range;
                range.parentContainer = parentContainer = this.annotator.findElementByXPath(range.parentContainerXPath);
                range.startContainer = startContainer = this.annotator.findElementByXPath(range.startContainerXPath);
                range.endContainer = endContainer = this.annotator.findElementByXPath(range.endContainerXPath);
            }

            startOffset = range.startOffset;
            endOffset = range.endOffset;



            if(startContainer.nodeType == Node.ELEMENT_NODE) {
                var startContainerParams = this.getTextNodeAtOffset(startContainer, startOffset);
                startContainer = startContainerParams[0];
                startOffset = startOffset - startContainerParams[1];
            }


            if(endContainer.nodeType == Node.ELEMENT_NODE) {
                var endContainerParams = this.getTextNodeAtOffset(endContainer, endOffset);
                endContainer = endContainerParams[0];
                endOffset = endOffset - endContainerParams[1];
            }


            if(startContainer == endContainer) {
                if(startContainer.nodeType != Node.ELEMENT_NODE) {
                    var startTextNode = startContainer.splitText(startOffset);
                    endContainer = startTextNode;
                    endOffset = endOffset - startOffset;

                    var endTextNode = endContainer.splitText(endOffset);
                    nodes.push(endContainer);
                }

            } else {
                if(startContainer.nodeType != Node.ELEMENT_NODE) {
                    var startTextNode = startContainer.splitText(startOffset);
                    nodes.push(startTextNode);
                }

                if(endContainer.nodeType != Node.ELEMENT_NODE) {
                    var endTextNode = endContainer.splitText(endOffset);
                    nodes.push(endContainer);
                }

                var innerNodes = this.getNodesToWrap(parentContainer, startContainer.nextSibling, endContainer);


                for(var i = 0; i < innerNodes.length; i++) {
                    nodes.push(innerNodes[i]);
                }
            }

            return nodes;
        },


        getTextNodeAtOffset: function(rootNode, offset) {
            var textNode,
            count = 0,
            found = false,
            countUptoPrev = 0;

            function getTextNodes(node) {
                if (node.nodeType == Node.TEXT_NODE && !/^\s*$/.test(node.nodeValue)) {
                    count += node.nodeValue.length;

                    if (count >= offset && found != true) {
                        textNode = node;
                        countUptoPrev = count - node.nodeValue.length;
                        found = true;
                    }
                } else if (node.nodeType == Node.ELEMENT_NODE) {
                    for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                        getTextNodes(node.childNodes[i]);
                    }
                }
            }

            getTextNodes(rootNode);
            return [textNode, countUptoPrev];

        },

        getNodesToWrap: function(rootNode, startNode, endNode) {
            var pastStartNode = false, reachedEndNode = false, textNodes = [];

            function getTextNodes(node) {
                if (node == startNode) {
                    pastStartNode = true;
                } 

                if (node == endNode) {
                    reachedEndNode = true;
                } else if (node.nodeType == Node.TEXT_NODE) {
                    if (pastStartNode && !reachedEndNode && !/^\s*$/.test(node.nodeValue)) {
                        textNodes.push(node);
                    }
                } else {
                    for (var i = 0, len = node.childNodes.length; !reachedEndNode && i < len; ++i) {
                        getTextNodes(node.childNodes[i]);
                    }
                }
            }

            getTextNodes(rootNode);
            return textNodes;
        },


        wrapNodes: function(temporary) {
            var nodes = this.getContainedNodes();
            var newNode = this.createWrapperElement(temporary)
            for(var i = 0; i < nodes.length; i++) {
                $(nodes[i]).wrap(newNode);
            }
        },

        createWrapperElement: function(temporary) {
            var annotationID = this.id;

            var span = document.createElement("span");

            if(!temporary) {
                span.classList.add("annotation");
                span.classList.add(this.color);
            } else {
                span.classList.add("temporary");
            }

            span.setAttribute("data-id", annotationID);

            return span;
        },

        removeTemporary: function() {
            var range, parentContainer;
            if(this._selectedRange) {
                range = this._selectedRange;
                parentContainer = range.commonAncestorContainer;
            } else {
                range = this.range;
                range.parentContainer = parentContainer = this.annotator.findElementByXPath(range.parentContainerXPath);
            }

            var temporary = $(parentContainer).find(".temporary")

            for(var i = 0; i < temporary.length; i++) {
                var elem = temporary[i];
                $(elem.childNodes[0]).unwrap();
            }
        },

        convertFromTemporary: function() {
            var range, parentContainer;
            if(this._selectedRange) {
                range = this._selectedRange;
                parentContainer = range.commonAncestorContainer;
            } else {
                range = this.range;
                range.parentContainer = parentContainer = this.annotator.findElementByXPath(range.parentContainerXPath);
            }

            var temporary = $(parentContainer).find(".temporary")

            temporary
            .removeClass("temporary")
            .addClass("annotation")
            .addClass(this.color);

        }


    };

    return Annotation;
})();
var Editor = (function Editor() {
    var Editor = {
        annotator: null,
        annotation: null,
        events: [
            {
                element: ".js-note-form",
                event: "submit",
                action: "addNote"
            },

            {
                selector: ".js-color-picker",
                event: "click",
                action: "setColor"
            },

            {
                selector: ".js-copy",
                event: "click",
                action: "copyToClipboard"
            },

            {
                selector: ".js-share",
                event: "click",
                action: "share"
            },

            {
                selector: ".js-remove-annotation",
                event: "click",
                action: "removeAnnotation"
            }
        ],

        init: function(opts) {
            this.annotator = opts.annotator;
            var $containerElement = $("body");
            this.$popoverElement = $(this.renderEditorTemplate());

            $containerElement.append(this.$popoverElement);

            // autocomplete
            if(Awesomplete){
                this._awesomplete = new Awesomplete(this.$popoverElement.find(".js-tags-field")[0]);
            }

            this.events.forEach(function(eventMap) {
                var editor = this;
                this.$popoverElement.on(eventMap["event"], eventMap["selector"], function(e) {
                    e.preventDefault();
                    editor[eventMap["action"]].call(editor, e);
                })
            }, this);
        },

        renderEditorTemplate: function() {
            var html =  '<div id="annotation-editor">'
                     +      '<ul class="dropdown-list">'
                     +          '<li class="colors">'
                     ;

            this.annotator.colors.forEach(function(color, index) {
                var className = 'js-color-picker color'
                              + ' ' + color.className 
                              + ' ' + (index == 0 ? 'active' : '')
                    ;
                html += '<span data-color="' + color.className + '" class="' + className + '"></span>';
            });

            html += '</li>'
                 +  '<li class="note-input">'
                 +      '<form class="js-note-form">'
                 +          '<input type="text" class="js-tags-field" placeholder="#revision, #later">' 
                 +          '<textarea class="js-note-field" placeholder="Add a note..."></textarea>'
                 +          '<input type="submit" id="add-button" value="Add Note" />'
                 +      '</form>'
                 +  '</li>'
                 +  '<li><a href="#" class="js-copy">Copy</a></li>'
                 +  '<li><span class="link">Share</span>'
                 +      '<ul class="dropdown-list sub-list">'
                 +          '<li class="js-facebook-share"><a href="#" class="js-share facebook">Facebook</a></li>'
                 +          '<li><a href="#" class="js-share twitter">Twitter</a></li>'
                 +      '</ul>'
                 +   '</li>'
                 +   '<li class="js-remove-annotation-wrapper"><a href="#" class="js-remove-annotation">Remove Highlight</a></li>'
                 +   '</ul>'
                 + '</div>'
            ;

            return html;
        },

        showEditor: function(opts) {
            var $popover = this.$popoverElement;

            var position = opts.position,
            annotation = opts.annotation,
            temporary = opts.temporary;

            var top = position.top - 30;
            var left = position.left - 90;

            if(annotation) {
                this.annotation = annotation;
                this.activateAnnotationColor();
                this.renderContents();

                if(!temporary) {
                    this.showRemoveBtn();
                }
            }

                   // FB Share
            if( !(window.FB) ) this.$popoverElement.find(".js-facebook-share").hide();
            else { this.$popoverElement.find(".js-facebook-share").show(); }


            if(temporary) {
                this.annotation.render({ temporary: true });
            }

            if(this._awesomplete) {
                this._awesomplete.list = this.annotator.tags;
            }

            $popover.removeClass("anim").css("top", top - 20).css("left", left).show();
            setTimeout(function() {
                $popover.addClass("anim").css("top", top );
                $popover.find("#annotation-input").focus();
            }, 0);
        },

        isVisible: function() {
            return this.$popoverElement.is(":visible");
        },

        reset: function() {
            this.annotation.removeTemporary();
            this.resetNoteForm();
            this.hideRemoveBtn();
            this.annotation = null;
            this.$popoverElement.removeAttr("style");
        },

        resetNoteForm: function() {
            this.$popoverElement.find(".js-note-field, .js-tags-field").val("");
        },

        activateAnnotationColor: function() {
            this.$popoverElement
                .find(".js-color-picker.active").removeClass("active");
            this.$popoverElement
                .find(".js-color-picker." + (this.annotation.color || 'yellow'))
                .addClass("active");
        },

        renderContents: function() {
            this.$popoverElement.find(".js-note-field").val(this.annotation.note);

            if(this.annotation.tags)
                this.$popoverElement.find(".js-tags-field").val(this.annotation.tags.join(", "));
        },

        showRemoveBtn: function() {
            this.$popoverElement.find(".js-remove-annotation-wrapper").show();
        },

        hideRemoveBtn: function() {
            this.$popoverElement.find(".js-remove-annotation-wrapper").hide();
        },

        hideEditor: function(event) {
            this.reset();
            this.$popoverElement.hide();
        },

        getTagsFromString: function(string) {
            var tags = string
                        .split(this.annotator.tagRegex)
                        .map(function(tag) {
                            var t = $.trim(tag);
                            if(t.length) return t;
                        });
            return tags;
        },

        setColor: function(e) {
            var $target = $(e.target);
            var color = $target.data("color");
            var $form = this.$popoverElement.find(".js-note-form");

            var note = $form.find(".js-note-field").val();
            var tags = this.getTagsFromString($form.find(".js-tags-field").val());

            this.saveAndClose({ color: color, note: note, tags: tags });
        },

        addNote: function(e) {
            var $form = $(e.target);
            var note = $form.find(".js-note-field").val();
            var tags = this.getTagsFromString($form.find(".js-tags-field").val());
            var color = this.annotation.color || this.annotator.defaultColor;

            this.saveAndClose({ color: color, note: note, tags: tags });
        },

        saveAndClose: function(data) {
            if(!data) return;

            var params = {
                debug: this.annotator.debug,
                cbk: function(annotation) {
                    if(!this.annotator.findAnnotation(annotation.id)) {
                        this.annotation.render({ convert: true });
                        this.annotator.annotations.push(annotation);
                    } else {
                        this.annotator.updateAnnotation(annotation.id, annotation);
                        this.annotation.render({ update: true });
                    }

                    // save tags to global list
                    this.annotator.addTags(annotation.tags);

                    if(this.annotator.debug)
                        this.saveToLocalStorage();

                    this.hideEditor();
                }.bind(this)
            }

            $.extend(params, data);
            void 0;
            this.annotation.save(params);
        },

        copyToClipboard: function() {
            var text = this.annotation.selectedText;

            var textarea = $("<textarea class='js-hidden-textarea'></textarea>");
            $(this.annotator.containerElement).append(textarea);
            textarea.val(text).select();

            try {
                document.execCommand("copy");
            } catch(e) {
                void 0;
            }

            this.hideEditor();
            textarea.remove();
        },

        truncate: function(str, limit) {

            if(str.length <= limit) return str;

            while(str.length >= limit) {
                str = str.substr(0, str.lastIndexOf(" "));
            }

            return str + "...";
        },

        removeAnnotation: function() {
            var annotation = this.annotation;
            var annotator = this.annotator;


            if(!annotation) return;

            var renderedAnnotation = $(this.annotator.containerElement)
                                        .find(".annotation[data-id='" + annotation.id + "']");

            this.annotation.destroy(function() {
                annotator.removeAnnotation(annotation.id);
                renderedAnnotation.contents().unwrap();
            });

            if(this.annotator.debug)
                this.saveToLocalStorage();
            this.hideEditor();
        },

        share: function(e) {
            var text = this.annotation.selectedText;
            var $target = $(e.target);

            if($target.hasClass("facebook")) {
                if( !(FB && FB.ui) ) return;
                void 0;
                FB.ui(
                    {
                        method: 'feed',
                        link: window.location.href,
                        description: text,
                        display: "popup"
                    },
                    function(response) {
                        if (response && !response.error_code) {
                            void 0;
                        } else {
                            void 0;
                        }
                    }
                );

            } else if($target.hasClass("twitter")) {
                var width  = 575,
                height = 400,
                left   = ($(window).width()  - width)  / 2,
                top    = ($(window).height() - height) / 2,
                opts   = 'status=1' +
                         ',width='  + width  +
                         ',height=' + height +
                         ',top='    + top    +
                         ',left='   + left,
                textLimit = 140 - '...'.length - window.location.href.length,
                windowURL = "http://twitter.com/share?text=" + window.encodeURIComponent( this.truncate(text, textLimit) || "");

                window.open(windowURL, 'Share', opts);
            } 

            this.hideEditor();

        },

        saveToLocalStorage: function() {
            // save to localStorage
            if(window.localStorage) {
                var serializedAnnotations = this.annotator.annotations.map(function(annotation) {
                    return annotation.serialize();
                });

                window.localStorage.setItem("annotations", JSON.stringify(serializedAnnotations));
            }
        }


    }


    return Editor;
})();
var Annotator = (function Annotator() {

    var Annotator = {
        containerElement: "body",
        annotations: [],
        editor: null,

        defaultColor: "yellow",
        colors: [
            {
                className: "yellow",
            },

            {
                className: "green",
            },

            {
                className: "pink",
            },

            {
                className: "blue",
            },
        ],

        tags: [],


        init: function(opts) {
            this.containerElement = opts.containerElement || "body";
            this.debug = opts.debug || "true";
            this.remoteURL = opts.remoteURL || "";

            if(opts.existingTags) {
                this.tags = opts.existingTags;
            }

            if(opts.colors) {
                this.colors = opts.colors;
            }

            if(opts.annotations) {
                this.renderExistingAnnotations(opts.annotations);
            }

            // Setup editor
            var editor = Object.create(Editor);
            editor.init({ annotator: this });
            this.setEditor(editor);
        },

        addTags: function(tags) {
            this.tags = this.tags.concat(tags);
        },

        setEditor: function(editor) {
            this.editor = editor;
        },

        findAnnotation: function(annotationID) {
            return this.annotations.filter(function(annotation) {
                return annotation.id == annotationID;
            })[0];
        },

        updateAnnotation: function(annotationID, newAnnotation) {
            var index = this.annotations.map(function(i) { return i.id }).indexOf(annotationID);
            if(index <= -1) return;
            this.annotations[index] = newAnnotation;
        },

        removeAnnotation: function(annotationID) {
            var index = this.annotations.map(function(i) { return i.id }).indexOf(annotationID);
            if(index <= -1) return;

            this.annotations.splice(index, 1);
        },

        renderExistingAnnotations: function(annotations) {
            for(var i = 0; i < annotations.length; i++) {
                var annotation = Object.create(Annotation);
                annotation.init({ savedAnnotation: annotations[i], annotator: this });
                annotation.render();
                this.annotations.push(annotation);
            }
        },


        handleAnnotationClick: function(e) {
            var $target = $(e.target);
            // if(!$target.hasClass("shown")) $target = $target.parents(".annotation.shown");
            var annotationID = $target.data("id");
            var annotation = this.findAnnotation(annotationID);

            void 0;
            window.ann = annotation

            if(!annotation) return;

            this.editor.showEditor({
                position:  {
                    top: e.pageY,
                    left: e.pageX
                },
                annotation: annotation
            });

        },

        handleAnnotation: function(e) {
            var selection = window.getSelection();
            var selectedText;
            if(selection.text) {
                selectedText = selection.text;
            } else {
                selectedText = selection.toString();
            };


            if(selection && !selection.isCollapsed && selectedText && selectedText.length>5) {
                var range = selection.getRangeAt(0);

                var annotation = Object.create(Annotation);
                annotation.init({ selectedRange: range, annotator: this });


                var position = {
                    top: e.pageY,
                    left: e.pageX
                };

                void 0;

                this.editor.showEditor({
                    position: {
                        top: e.pageY,
                        left: e.pageX
                    },
                    annotation: annotation,
                    temporary: true
                });
            }
        },

        startListening: function() {
            var $element = $(this.containerElement);
            var self = this;


            $element.on("click", ".annotation", function(e) {
                e.stopPropagation();
                self.handleAnnotationClick(e);
            });

            $element.on("mouseup touchend", function(e) {
                e.preventDefault();
                var $target = $(e.target);

                if(self.editor.isVisible() && !$target.parents("#annotation-editor").length && !$target.hasClass("annotation")) {
                    // editor is open but clicked outside
                    self.editor.hideEditor()
                }

   
                self.handleAnnotation(e);
            });

        },

        findElementByXPath: function(path) {
            var evaluator = new XPathEvaluator(); 
            var result = evaluator.evaluate(path, document.documentElement, null,XPathResult.FIRST_ORDERED_NODE_TYPE, null); 
            return  result.singleNodeValue; 
        },

        createXPathFromElement: function(elm) {
            var allNodes = document.getElementsByTagName('*'); 

            for (var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode) { 
                if (elm.hasAttribute('id')) { 
                    var uniqueIdCount = 0; 
                    for (var n=0;n < allNodes.length;n++) { 
                        if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++; 
                        if (uniqueIdCount > 1) break; 
                    }; 

                    if ( uniqueIdCount == 1) { 
                        segs.unshift('id("' + elm.getAttribute('id') + '")'); 
                        return segs.join('/'); 
                    } else { 
                        segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]'); 
                    } 

                } else if (elm.hasAttribute('class')) { 
                    segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]'); 
                } else { 
                    for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) { 
                        if (sib.localName == elm.localName)  i++; 
                    }; 
                    segs.unshift(elm.localName.toLowerCase() + '[' + i + ']'); 
                }; 
            } 

            return segs.length ? '/' + segs.join('/') : null; 
        }

    };

    return Annotator;
})();