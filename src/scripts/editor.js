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
            var left = position.left - this.$popoverElement.width()/2;

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

            $popover.removeClass("anim").css("top", top).css("left", left).show();
            $popover.find("#annotation-input").focus();
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
            console.log(params);
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
                alert("Hit Ctrl/Cmd + C to copy");
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
                console.log(window.location.href);
                FB.ui(
                    {
                        method: 'feed',
                        link: window.location.href,
                        description: text,
                        display: "popup"
                    },
                    function(response) {
                        if (response && !response.error_code) {
                            console.log('Posting completed.');
                        } else {
                            console.log('Error while posting.');
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