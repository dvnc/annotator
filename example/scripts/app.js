jQuery(document).ready(function($) {

    // Existing tags for the user.
    // Ideally it should come from the server
    var tags = [
        "revision",
        "group study",
        "assignment",
        "later",
        "exam"
    ];

    var defaultAnnotations =  [
        {
            range: {
                startOffset: 28,
                endOffset: 77,
                startContainerXPath: "id(\"book\")/p[5]",
                endContainerXPath: "id(\"book\")/p[5]",
                parentContainerXPath: "id(\"book\")/p[5]"
            },
            id: "annotation-1435820385354",
            selectedText: "Boojho recalled the consequences of deforestation",
            color: "pink",
            note: "This is my note"

        },


        {
            range: {
                startOffset: 41,
                endOffset: 379,
                startContainerXPath: "id(\"book\")/p[7]",
                endContainerXPath: "id(\"book\")/p[7]",
                parentContainerXPath: "id(\"book\")/p[7]"
            },
            selectedText: "increased chances of natural calamities such as floods and droughts. Recall that plants need carbon dioxide for photosynthesis. Fewer trees would mean that less carbon dioxide will be used up resulting in its increased amount in the atmosphere. This will lead to global warming as carbon dioxide traps the heat rays reflected by the earth",
            color: "green",
            note: "This is another note"
        },

        {
            range: {
                startOffset: 274,
                endOffset: 497,
                startContainerXPath: "id(\"book\")/p[7]",
                endContainerXPath: "id(\"book\")/p[7]",
                parentContainerXPath: "id(\"book\")/p[7]"
            },
            id: "annotation-1435824292078",
            selectedText: "atmosphere. This will lead to global warming as carbon dioxide traps the heat rays reflected by the earth. The increase in temperature on the earth disturbs the water cycle and may reduce rainfall. This could cause droughts",
            color: "yellow"
        }
    ];

    var annotations = (function() {
        if(window.localStorage) {
            var annotations = JSON.parse(localStorage.getItem("annotations"));

            if( !annotations || annotations.length == 0 ) {
                window.localStorage.setItem("annotations", JSON.stringify(defaultAnnotations));
                return defaultAnnotations;
            }
            return annotations;
        } else {
            return [];
        }
    })();

    var colors = [
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
    ]

    var annotator = Object.create(Annotator);
    annotator.init({
        containerElement: "#book",
        annotations: annotations,
        existingTags: tags,
        colors: colors
    });
    annotator.startListening();

});