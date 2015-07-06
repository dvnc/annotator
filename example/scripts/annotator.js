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

            console.log("ANNOTATION", annotationID);
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

                console.log(position);

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


            $element.on("mouseup touchend", function(e) {
                e.preventDefault();
                var $target = $(e.target);
                console.log("TARGET", $target);

                if(self.editor.isVisible() && !$target.parents("#annotation-editor").length && !$target.hasClass("annotation")) {
                    // editor is open but clicked outside
                    self.editor.hideEditor()
                }

                if ($target.hasClass("annotation")) {
                    // shown annotation clicked
                    // set up editor again for editing annotation
                    self.handleAnnotationClick(e);
                } else {
                    self.handleAnnotation(e);
                }
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