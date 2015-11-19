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


    var annotations = (function() {
        if(window.localStorage) {
            return JSON.parse(localStorage.getItem("annotations"));
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