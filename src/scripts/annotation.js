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

            console.log(startNode.firstChild, nodesBetweenStart);

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
                console.log(JSON.stringify(data));
            } else {
                this.postToRemote();
            }

            if(obj && obj.cbk) obj.cbk(this);

        },

        destroy: function(cbk) {
            console.log("Destroying", this.id);
            if(cbk) cbk();
        },

        postToRemote: function() {
            // TODO
            console.log("AJAX");
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