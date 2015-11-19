(function ($) {
    function renderAdvSearchDatasetSources(parent, sources)
        {
            if ((!parent) || (!sources) || sources.length == 0)
                return;

            var content = '';
            for (var i = 0; i < sources.length; i++)
            {
                content += '<label class="checkbox"><input type="checkbox" name="sourceCheckbox" value="';
                content += sources[i] + '"/>' + sources[i] + '</label>';
            }
            parent.append(content);
        }

        $.ui.autocomplete.prototype._renderItem = function( ul, item){
            var term = this.term.split(' ').join('|');
            var re = new RegExp("(" + term + ")", "gi") ;
            var t = item.label.replace(re,"<b><font color='blue'>$1</font></b>");
            return $( "<li></li>" )
                .data( "item.autocomplete", item )
                .append( "<a>" + t + "</a>" )
                .appendTo( ul );
        };

        var maxReturnedResults = 50;
        function split( val ) {
            return val.split( /,\s*/ );
        }

        function extractLast( term ) {
            return split( term ).pop();
        }

        $.get('/api/v1/autocomplete/search', function(data){
            $('#searchInput').autocomplete({
                source: function(request, response) {
                    var results = $.ui.autocomplete.filter(data.source, request.term);
                    response(results.slice(0, 20));
                }
            });

        });

        $.get('/api/v1/advsearch/scopes', function(data){
            $(".scopeInput").autocomplete({
                minLength: 0,
                source: function( req, res ) {
                    var results = $.ui.autocomplete.filter(data.scopes, extractLast( req.term ));
                    res(results.slice(0,maxReturnedResults));
                },
                focus: function() {
                    return false;
                },
                select: function( event, ui ) {
                    var terms = split( this.value );
                    terms.pop();
                    terms.push( ui.item.value );
                    terms.push( "" );
                    this.value = terms.join( ", " );
                    return false;
                }
            });
        });

        $.get('/api/v1/advsearch/tables', function(data){
            $(".tableInput").autocomplete({
                minLength: 0,
                source: function( req, res ) {
                    var results = $.ui.autocomplete.filter(data.tables, extractLast( req.term ));
                    res(results.slice(0,maxReturnedResults));
                },
                focus: function() {
                    return false;
                },
                select: function( event, ui ) {
                    var terms = split( this.value );
                    terms.pop();
                    terms.push( ui.item.value );
                    terms.push( "" );
                    this.value = terms.join( ", " );
                    return false;
                }
            });
        });

        $.get('/api/v1/advsearch/fields', function(data){
            $(".fieldInput").autocomplete({
                minLength: 0,
                source: function( req, res ) {
                    var results = $.ui.autocomplete.filter(data.fields, extractLast( req.term ));
                    res(results.slice(0,maxReturnedResults));
                },
                focus: function() {
                    return false;
                },
                select: function( event, ui ) {
                    var terms = split( this.value );
                    terms.pop();
                    terms.push( ui.item.value );
                    terms.push( "" );
                    this.value = terms.join( ", " );
                    return false;
                }
            });
        });

        $( "#scopeInInput" ).blur(function() {
            $.get('/api/v1/advsearch/tables', {scopes: $( "#scopeInInput").val()}, function(data){
                $(".tableInput").autocomplete({
                    minLength: 0,
                    source: function( req, res ) {
                        var results = $.ui.autocomplete.filter(data.tables, extractLast( req.term ));
                        res(results.slice(0,maxReturnedResults));
                    },
                    focus: function() {
                        return false;
                    },
                    select: function( event, ui ) {
                        var terms = split( this.value );
                        terms.pop();
                        terms.push( ui.item.value );
                        terms.push( "" );
                        this.value = terms.join( ", " );
                        return false;
                    }
                });
            });
        });

        $( "#tableInInput" ).blur(function() {
            $.get('/api/v1/advsearch/fields', {tables: $( "#tableInInput").val()}, function(data){
                $(".fieldInput").autocomplete({
                    minLength: 0,
                    source: function( req, res ) {
                        var results = $.ui.autocomplete.filter(data.fields, extractLast( req.term ));
                        res(results.slice(0,maxReturnedResults));
                    },
                    focus: function() {
                        return false;
                    },
                    select: function( event, ui ) {
                        var terms = split( this.value );
                        terms.pop();
                        terms.push( ui.item.value );
                        terms.push( "" );
                        this.value = terms.join( ", " );
                        return false;
                    }
                });
            });
        });

        $('#searchBtn').click(function(){
            var inputObj = $('#searchInput');
            if (inputObj)
            {
                var keyword = inputObj.val();
                if (keyword)
                {
                    window.location = '/#/search?keywords=' + keyword + '&category=Dataset&source=all&page=1';
                }
            }
        });

        $('#advSearchBtn').click(function(){
            var empty = true;
            var scopeInInputObj = $('#scopeInInput');
            var scopeIn = '';
            if (scopeInInputObj)
            {
                scopeIn = scopeInInputObj.val();
                if (scopeIn)
                {
                  empty = false;
                }
            }
            var scopeNotInInputObj = $('#scopeNotInInput');
            var scopeNotIn = '';
            if (scopeNotInInputObj)
            {
                scopeNotIn = scopeNotInInputObj.val();
                if (scopeNotIn)
                {
                  empty = false;
                }
            }
            var tableInInputObj = $('#tableInInput');
            var tableIn = '';
            if (tableInInputObj)
            {
                tableIn = tableInInputObj.val();
                if (tableIn)
                {
                  empty = false;
                }
            }
            var tableNotInInputObj = $('#tableNotInInput');
            var tableNotIn = '';
            if (tableNotInInputObj)
            {
                tableNotIn = tableNotInInputObj.val();
                if (tableNotIn)
                {
                  empty = false;
                }
            }
            var fieldAnyInputObj = $('#fieldAnyInput');
            var fieldAny = '';
            if (fieldAnyInputObj)
            {
                fieldAny = fieldAnyInputObj.val();
                if (fieldAny)
                {
                  empty = false;
                }
            }
            var fieldAllInputObj = $('#fieldAllInput');
            var fieldAll = '';
            if (fieldAllInputObj)
            {
                fieldAll = fieldAllInputObj.val();
                if (fieldAll)
                {
                  empty = false;
                }
            }
            var fieldNotInInputObj = $('#fieldNotInInput');
            var fieldNotIn = '';
            if (fieldNotInInputObj)
            {
                fieldNotIn = fieldNotInInputObj.val();
                if (fieldNotIn)
                {
                  empty = false;
                }
            }
            var commentsInputObj = $('#commentsInput');
            var comments = '';
            if (commentsInputObj)
            {
                comments = commentsInputObj.val();
                if (comments)
                {
                  empty = false;
                }
            }
            var sources = '';
            $('input[name="sourceCheckbox"]:checked').each(function() {
                sources += this.value + ','
            });
            sources = sources.substring(0, sources.length-1);
            if (sources)
            {
              empty = false;
            }
            if (empty)
            {
              return;
            }

            var advSearchOpts = {};
            advSearchOpts.scope = {'in': scopeIn, 'not': scopeNotIn};
            advSearchOpts.table = {'in': tableIn, 'not': tableNotIn};
            advSearchOpts.fields = {'any': fieldAny, 'all': fieldAll, 'not': fieldNotIn};
            advSearchOpts.comments = comments;
            advSearchOpts.sources = sources;
            window.location.hash = "#/advsearch/?query=" + btoa(JSON.stringify(advSearchOpts)) + '&page=1';
        });

        $('#advSearchResetBtn').click(function(){
            var scopeInInputObj = $('#scopeInInput');
            if (scopeInInputObj)
            {
                scopeInInputObj.val('');
            }
            var scopeNotInInputObj = $('#scopeNotInInput');
            if (scopeNotInInputObj)
            {
                scopeNotInInputObj.val('');
            }
            var tableInInputObj = $('#tableInInput');
            if (tableInInputObj)
            {
                tableInInputObj.val('');
            }
            var tableNotInInputObj = $('#tableNotInInput');
            if (tableNotInInputObj)
            {
                tableNotInInputObj.val('');
            }
            var fieldAnyInputObj = $('#fieldAnyInput');
            if (fieldAnyInputObj)
            {
                fieldAnyInputObj.val('');
            }
            var fieldAllInputObj = $('#fieldAllInput');
            if (fieldAllInputObj)
            {
                fieldAllInputObj.val('');
            }
            var fieldNotInInputObj = $('#fieldNotInInput');
            if (fieldNotInInputObj)
            {
                fieldNotInInputObj.val('');
            }
            var commentsInputObj = $('#commentsInput');
            if (commentsInputObj)
            {
                commentsInputObj.val('');
            }
            $('input[name="sourceCheckbox"]:checked').each(function() {
                this.checked = false;
            });
        });

})(jQuery)