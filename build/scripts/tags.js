var TagList = (function() {

    var _tags = [];

    var TagList = {
        init: function(tags) {
            _tags.concat(tags || [])
        },

        findAll: function() {
            return _tags;
        },

        findBySlug: function(slug) {
            return _tags.filter(function(tag) {
                return tag.slug == slug;
            })[0];
        },

        mapByParameter: function(param) {
            return (this.findAll().map(function(tag) {
                return tag[param]
            }) || []);
        },

        getTagsFromString: function(tagString) {
            if(!tagString.length) return;
            var tags = tagString.split(/,\s+/);
            var result = [];
            var self = this;

            tags.forEach(function(tagStr) {
                var tagSlug = self.getSlugForName(tagStr);
                var existingTag = self.findBySlug(tagSlug);

                if(existingTag && existingTag.length) {
                    result.push(existingTag.slug);
                } else {
                    var tag = self.create(tagStr);
                    result.push(tag.slug); 
                }

            });

            return result;
        },

        getTagsFromSlugs: function(tagSlugs) {
            var tags = tagSlugs.split(/,\s+/);
            var result = [];
            var self = this;

            tags.forEach(function(tagSlug) {
                var tag = self.findBySlug(tagSlug);

                if(tag) {
                    result.push(tag);
                }
            })

            return result;
        },

        getSlugForName: function(name) {
            return name.toString().toLowerCase().replace(/[^a-z0-1_-]/g, '');
        },

        create: function(name) {
            var slug = this.getSlugForName(name);
            var tag = this.findBySlug(slug);

            var color = tag ? tag.color : this.generateRandomColor();

            var newTag = {
                name: name,
                slug: slug,
                color: color
            }

            _tags.push(newTag);
            return newTag;
        },

        generateRandomColor: function() {
            return 'rgb(' +  (Math.floor(50*Math.random()) + 200) + ',' 
                +  (Math.floor(20*Math.random()) + 190) + ','  
                +  (Math.floor(80*Math.random()) + 180) + ')';
        }
    };


    return TagList;

})();