/*
 * Livetable - jQuery plugin
 * Dynamically edit HTML tables
 *
 * Copyright (c) 2010 Andrew Smith
 * Examples and documentation at: http://github.com/ashrewdmint/livetable
 * 
 * Version: 1.0.0 (date)
 * Requires: jQuery v1.3+
 * 
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function($){
  
  // $.livetable

  $.livetable = {
    name:             'livetable',
    types:            {},
    default_options:  {
      selectedClass: 'selected',
      focusAfterSelect: true,
      beforeDeselect: function(td) {
        td.parents('table').livetable('save');
      },
      beforeDiscardChanges: function() {
        return confirm('Are you sure you want to discard your changes?');
      }
    },
    methods:          ['destroy', 'disable', 'enable', 'isDisabled', 'serialize', 'select', 'deselect', 'hasChanges', 'changes', 'restore', 'save', 'last'],
    return_methods:   ['isDisabled', 'serialize', 'hasChanges', 'changes', 'last'],
    events:           ['onSelect', 'beforeSelect', 'onDeselect', 'beforeDeselect', 'onSerialize', 'beforeDiscardChanges'],
    
    isRememberLoaded:  function() {
      return typeof($.fn.remember) == 'function';
    },
    
    // Default to_field conversion
    defaultOptionsToField: function(name, td, input) {
      return $('<input />').attr({
        type: 'text',
        name:  name,
        id:    name,
        value: td.text()
      });
    },
    
    // Default to_text conversion
    defaultOptionsToText: function(input, old_content) {
      return input.val();
    },
    
    // Adds a new type.
    // Name must be a string, to_field and to_text must be functions
    // If functions are not supplied, defaults will be used.
  
    addType: function(name, to_field, to_text) {
      if (typeof(name) == 'string') {
        to_field = typeof(to_field) == 'function' ? to_field : this.defaultOptionsToField;
        to_text  = typeof(to_text)  == 'function' ? to_text  : this.defaultOptionsToText;
        
        this.types[name] = {toField: to_field, toText: to_text};
        return true;
      }
      return false;
    },
    
    // Removes a type and returns the type's two functions.
    // Returns false if nothing was removed.
    
    removeType: function(name) {
      var method = this.types[name];
      delete this.types[name];
      return method || false;
    },
    
    // Returns true if name is a type, false if otherwise.
    
    hasType: function(name) {
      return typeof(this.types[name]) != 'undefined';
    },
    
    
    // Finds all attr and class data in an element
    
    collect: function(el) {
      el = $(el);
      
      if (! el.length)
        return false;
      
      var data = {};
      
      // Clone element, wrap it in a div, and find the html
      var html = el.clone().wrap('<div></div>').parent().html();
      
      // Grab the contents of the first tag to iterate through the attrs
      var attrs = html.replace(/[^ ]+([^>]+).*/, '$1').split(' ');
      
      // Loop through attrs
      $.each(attrs, function(index, pair){
        if (! pair)
          return;
        
        pair = pair.split('=');
        
        if (pair.length != 2)
          return;
        
        var value = pair[1].replace(/^["']|["']$/g, ''); // Remove quotes
        var key   = pair[0];
        
        if (key.indexOf('data-') >= 0) {
          data[key.substr(5)] = value; // substr removes "data-" text from key name
        }
      });
      
      // Loop through classes
      $.each(el.attr('class').split(' '), function(index2, pair){
        if (! pair) return;
        
        pair = pair.split('-');
        
        if (pair.length < 2)
          return;
        
        data[pair.shift()] = pair.join('-');
      });
      return data;
    },
    
    // Uses collect() to gather column data for a <td>. If no name is
    // found, a name will be created by combining the type and the
    // column number together ("text2").
    
    columnData: function(td) {
      td = $(td);
      var column = this.column(td);
      
      // Find the first <th> or <td> in the correct column;
      var target = td.parents('table:first').find('tr:first').children().eq(column);
      
      // Target not found? Use the <td> instead
      target = target.length ? target : td;
      
      var data = this.collect(target);
      
      // Set column
      data.column = this.column(td);
      
      // Default name
      if (! data.name && data.type) {
        data.name = data.type + data.column;
      }
      
      return data;
    },
    
    // Finds the column number of a <td>. Takes colspan into account.
    // First column is 0, second is 1, etc.
    
    column: function(td) {
      var position = 0, increase, colspan;
      
      $(td).prevAll().each(function() {
        colspan = parseInt($(this).attr('colspan'), 10);
        increase = colspan > 0 ? colspan : 1;
        position += increase;
      });
      
      return position;
    },
    
    // Transforms a row

    transformRow: function(row, form) {
      var self = this, td, data, type, input, result;
      
      $(row).children('td').each(function() {
        td = $(this);
        data = self.columnData(td);
        
        if (! data.type || ! self.hasType(data.type)) {
          return;
        }
        
        type = self.types[data.type];
        
        if (form == 'fields') {
          td.data('oldhtml', td.html());
          input  = self.defaultOptionsToField(data.name, td);
          result = type.toField(data.name, td, input);
        }
        
        if (form == 'text') {
          result = type.toText(td.find(':input'), td, td.data('oldhtml'));
        }
        
        td.html(result);
      });
      return row;
    },

    // Converts a row's fields to text

    rowToText: function(row) {
      return this.transformRow(row, 'text');
    },

    // Converts a row to fields

    rowToFields: function(row) {
      return this.transformRow(row, 'fields');
    },
    
    // Creates a new instance of Livetable and stores it in a table element.
    
    create: function(table, options) {
      table = $(table);
      
      if (! table.is('table')) return false;
      
      table.data(this.name, new Livetable(table, options));
      return table.data(this.name);
    },
    
    // Get an instance of Livetable stored in a table element.
    // Returns false if no instance found.
    
    get: function(table) {
      table = $(table);
      if (typeof(table.data(this.name)) == 'object') {
        return table.data(this.name);
      }
      return false;
    },
    
    // Formats a number. Rounds to desired number of decimals.
    // Thousands separator, decimal character, and negative
    // number formatting are all customizeable.
    // To customize negative number formatting, pass a string
    // to the "negative" argument, using "n" as a placeholder
    // for the negative number. Default value is "-n", but
    // you may prefer to use "(n)" or "n-".
    
    formatNumber: function(number, places, separator, decimal_char, negative) {
      
      if (isNaN(number) || typeof(number) != 'number') {
        
        number = parseFloat(number);
        
        if (isNaN(number))
          return false;
      }
      
      if (typeof(separator) != 'string')
        separator = ',';
      
      if (typeof(decimal_char) != 'string')
        decimal_char = '.';
      
      if (typeof(negative) != 'string')
        negative = '-n';
      
      if (typeof(places) != 'number' || isNaN(places))
        places = parseFloat(places) || 0;
      
      // Round to decimal places
      if (places) {
        var multiplier = Math.pow(10, places);
        number = Math.round(number * multiplier) / multiplier;
      }
      
      number = number.toString();
      var decimals = number.split('.');
      var original_number = number;
      number = decimals[0];
      
      // Set decimals
      decimals = decimals[1] ? decimals[1] : '';
      
      while (decimals.length < places) {
        decimals += '0';
      }
      
      if (decimals)
        decimals = decimal_char + decimals;
      
      // Add separator to number
      
      if (separator) {
        reversed = number.split('').reverse();
        number = [];
        $.each(reversed, function(i, n){
          if (i % 3 == 0 && i > 0 && i != reversed.length - 1) {
            n += separator;
          }
          number.push(n);
        });
        
        number = number.reverse().join('');
      }
      
      // Add decimals
      
      number += decimals;
      
      // Format negative number
      
      if (Math.abs(original_number) != original_number) {
        number = number.replace(/^-/, '');
        number = negative.replace(/n/, number);
      }
      
      return number;
    },
    
    // Takes a string and returns a number.
    
    parseNumber: function(string, separator, decimal_char, negative) {
      if (typeof(string) != 'string')
        return false;
      
      if (typeof(separator) != 'string')
        separator = ',';
      
      if (typeof(decimal_char) != 'string')
        decimal_char = '.';
      
      if (typeof(negative) != 'string')
        negative = '-n';
      
      // Escape
      
      separator    = this.regexEscape(separator);
      decimal_char = this.regexEscape(decimal_char);
      negative     = this.regexEscape(negative);
      
      // Remove negative formatting
      
      nchars = negative.split('n');
      nchars[0] = '^' + nchars[0];
      nchars[1] += '$';
      
      if (string.match(nchars[0]) && string.match(nchars[1])) {
        string = string
            .replace(new RegExp(nchars[0]), '-')
            .replace(new RegExp(nchars[1]), '');
        
        if (string.split('')[0] != '-')
          string = '-' + string;
      }
      
      // Replace separator and decimal_char
      
      string = string
        .replace(new RegExp(separator, 'g'), '')
        .replace(new RegExp(decimal_char), '.');
      
      return parseFloat(string);
    },
    
    // Escapes regex special characters
    // From: http://snipplr.com/view/9649/escape-regular-expression-characters-in-string/
    regexEscape: function(string) {
      var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g"); // .*+?|()[]{}\
      return string.replace(specials, "\\$&");
    }
  };
  
  // Livetable
  
  function Livetable(table, options) {
    this.table      = $(table);
    this.disabled   = false;
    this.options    = $.extend({}, $.livetable.default_options, options);
    this.id         = Math.ceil(Math.random() * 10 * 1000000);
    this.name       = $.livetable.name + this.id;
    this._setupEvents();
  }
  
  $.livetable._class = Livetable;
  
  $.extend(Livetable.prototype, {
    disable: function() {
      this.disabled = true;
    },
    
    enable: function() {
      this.disabled = false;
    },
    
    isDisabled: function() {
      return this.disabled;
    },
    
    destroy: function() {
      var self = this;
      this.deselect();
      
      // Remove livetable data
      this.table.removeData($.livetable.name);
      
      // Unbind all events associated with this instance
      $('*').add(this.table).find('*').unbind('.' + this.name);
    },
    
    select: function(row, event) {
      if (this.disabled) return null;
      
      row = this._findRow(row);
      if (row) {
        // If the row is not already selected, and deselecting other
        // rows doesn't return false, and the beforeSelect callback
        // doesn't return false.
        var not_skipped = false;
        var already_selected = row.is('.' + this.options.selectedClass);
        
        if (! already_selected) {
          if (not_skipped = this.deselect(null, event) !== false) {
            not_skipped = this._trigger('beforeSelect', row, event) !== false;
          }
        }
        
        if (not_skipped) {
          row.addClass(this.options.selectedClass);
          
          $.livetable.rowToFields(row);
          
          if (event && this.options.focusAfterSelect) {
            $(event.target).find(':input').focus();
          }
          
          // Remember changes
          this._remember();
          
          this._trigger('onSelect', row);
          return true;
        } else {
          return false;
        }
      }
      return null;
    },
    
    deselect: function(row, event) {
      if (this.disabled) return null;
      
      // Ensure that the row is either a real <tr> or false
      // If no row has been supplied, find the current row;
      row = row ? this._findRow(row) : this._currentRow();
      
      if (row) {
        var not_skipped = this._trigger('beforeDeselect', row, event) != false;
        if (not_skipped && this._remember('hasChanges')) {
          not_skipped = this._trigger('beforeDiscardChanges', row, this._remember('changes')) != false;
        }
        
        if (not_skipped) {
          this._remember('restore');
          $.livetable.rowToText(row);
          row.removeClass(this.options.selectedClass);
          this._trigger('onDeselect', row);
          return true;
        } else {
          return false;
        }
      }
      return null;
    },
    
    option: function(name, value) {
      if (typeof(value) == 'undefined' || this.disabled) {
        return this.options[name];
      }
      this.options[name] = value;
      return value;
    },
    
    save: function() {
      if (this.disabled) return null;
      return this._remember('save');
    },
    
    restore: function() {
      if (this.disabled) return null;
      return this._remember('restore');
    },
    
    hasChanges: function() {
      return this._remember('hasChanges');
    },
    
    changes: function() {
      return this._remember('changes');
    },
    
    serialize: function(return_obj) {
      return this._remember('serialize', return_obj);
    },
    
    last: function(return_obj) {
      return this._remember('last', return_obj);
    },
    
    // Triggers an event callback. Returns result of callback, if callback
    // was found. Returns null otherwise.
    
    _trigger: function() {
      arguments = $.makeArray(arguments);
      var callback = this.options[arguments.shift()];
      
      if (typeof(callback) == 'function') {
        return callback.apply(callback, arguments);
      }
      return null;
    },
    
    // Finds the currently selected row
    
    _currentRow: function() {
      return this._findRow(this.table.find('.' + this.options.selectedClass));
    },
    
    // Ensures an element is a <tr> inside of the correct <table>
    
    _findRow: function(row) {
      var inside_table = false, self = this;
      row = $(row);

      if (! row.is('tr')) {
        row = row.parents('tr:first');
      }
      
      this.table.find('tr').each(function(){
        var tr = $(this);
        
        if (tr[0] == row[0]) {
          row = tr;
          inside_table = true;
        }
      });
      
      if (row.length && inside_table && ! row.parents('thead').length) {
        return row;
      }
      return null;
    },
    
    _setupEvents: function() {
      var self = this;
      
      // Select
      var trs = this.table.children().not('thead').find('tr');
      this._bind(trs, 'click', function(event){
        self.select(event.target, event);
        
        // http://www.quirksmode.org/js/events_order.html
        event.cancelBubble = true;
        if (event.stopPropagation) event.stopPropagation();
      });
      
      // Deselect
      this._bind('body', 'click', function(event) {
        if (! self._findRow(event.target)) {
          self.deselect(null, event);
        }
      });
    },
    
    _remember: function(method, arg) {
      if ($.livetable.isRememberLoaded()) {
        var row = this._currentRow();
        if (row) {
          return row.remember(method, arg);
        }
      } else {
        throw "Livetable: attempted to call remember plugin when it isn't loaded";
      }
      return false;
    },
    
    _bind: function(el, type, handler) {
      $(el).bind(type + '.' + this.name, handler);
    }
  });

  // Setup default types
  
  // Text
  
  $.livetable.addType('text');

  // Textarea

  $.livetable.addType('textarea', function(name, td) {
    return $('<textarea></textarea>').attr({
      type: 'text',
      name:  name,
      id:    name
    }).text(td.text());
  });

  // Number
  // Custom arguments
  //   - places
  //   - decimal-char
  //   - separator
  //   - negative

  $.livetable.addType('number', function(name, td, input) {
    var text = td.text();
    
    var separator    = $.livetable.data(td, 'separator');
    var negative     = $.livetable.data(td, 'negative');
    var decimal_char = $.livetable.data(td, 'decimal-char');
    
    var number = $.livetable.parseNumber(text, separator, decimal_char, negative);
    input.val(number);
    
    // Limit to numeric characters, plus . and -
    input.keypress(function(e){
      var key = String.fromCharCode(e.keyCode);
      if (key.match(/[^0-9\.\-]/) && ! (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
    });
    
    return input;
  }, function(input, old_content) {
    var td = input.parents('td').eq(0);
    
    var separator    = $.livetable.data(td, 'separator');
    var negative     = $.livetable.data(td, 'negative');
    var decimal_char = $.livetable.data(td, 'decimal-char');
    var places       = $.livetable.data(td, 'places');
    
    return $.livetable.formatNumber(input.val(), places, separator, decimal_char, negative);
  });
  
  // Plugin
  
  $.fn.livetable = function() {
    var first = arguments[0], second = arguments[1], third = arguments[2], options, method, lt;
    lt = $.livetable.get(this);
    
    if (first != 'option') {
      method = first;
      
      // If we need to return something specific, call method on first element
      if ($.inArray(method, $.livetable.return_methods) >= 0) {
        if (lt) {
          return lt[method](second);
        }
      }
      // Otherwise, loop through all matched elements
      else {
        if (typeof(method) == 'object') {
          options = method;
        }
        $(this).each(function(){
          // Create
          if (options || ! method) {
            $.livetable.create(this, options);
          }
          else {
            // Get instance for this element
            lt = $.livetable.get(this);
            if (lt && $.inArray(method, $.livetable.methods) >= 0) {
              lt[method](second);
            }
          }
          
        });
      }
    }
    // Options
    else if (lt) {
      var result = lt.option(second, third);
      if (typeof(third) != 'undefined') {
        return result;
      }
    }
    // Return jQuery object
    return this;
  };
  
})(jQuery);