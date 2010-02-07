/*
 * Livetable - jQuery plugin
 * Dynamically edit HTML tables
 *
 * Copyright (c) 2010 Andrew Smith
 * Examples and documentation at: http://github.com/ashrewdmint/livetable
 * 
 * Version: 0.0.0 (date)
 * Requires: jQuery v1.3+
 * 
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function($){

  var KEY          = 'livetable';
  var KEY_OC       = KEY + '.oldcontent';
  var DEFAULT_TYPE = 'text';
  
  // $.livetable

  $.livetable = {
    _types:          {},
    _default:        {rememberChanges: true, selectedClass: 'selected'},
    _methods:        ['destroy', 'disable', 'enable', 'isDisabled', 'serialize', 'select', 'deselect', 'hasChanges', 'changes', 'reset'],
    _return_methods: ['isDisabled', 'serialize', 'hasChanges', 'changes'],
    _events:         ['onSelect', 'beforeSelect', 'onDeselect', 'beforeDeselect', 'onSerialize', 'beforeDiscardChanges'],
    
    // Adds a new type. Name must be a string.
    // To_field and to_text must be functions.
    // 
    // The first function, to_field, is called when a row is being selected.
    // It is passed a <td> element and must return a field element (input,
    // textarea, select, etc.). The second function, to_text, is called
    // when a row is being deselected, and does the opposite of to_field. It
    // is passed a <td> element and a string containing the contents of the
    // <td> before the row was selected. To_text must return a string, which
    // will be inserted into the <td> in place of the field.
    // The string may contain HTML.
    // 
    // Returns true if successful, returns false if otherwise.
  
    addType: function(name, to_field, to_text) {
      if (typeof(name) == 'string' && typeof(to_field) == 'function' && typeof(to_text) == 'function') {
        this._types[name] = {to_field: to_field, to_text: to_text};
        return true;
      }
      return false;
    },
    
    // Removes a type and returns the type's two functions.
    
    removeType: function(name) {
      var method = this._types[name];
      delete this._types[name];
      return method;
    },
    
    // Returns true if name is a type, false if otherwise.
    
    hasType: function(name) {
      return typeof(this._types[name]) != 'undefined';
    },
    
    // Looks for data set on an element in data attributes or classes.
    // Returns data value, or null if nothing was found.
    
    data: function(el, name) {
      var value, attr_value, regex, match;
      el = $(el);
      
      // Look in classes
      regex = new RegExp(name + '-([^ ]+)');
      match = el.attr('class').match(regex);
      
      if (match && typeof(match[1]) == 'string') {
        value = match[1];
      } else {
        value = null;
      }
      
      // Look in attributes
      if (! value) {
        attr_value = el.attr('data-' + name);
        if (typeof(attr_value) == 'string' && attr_value !== '') {
          value = attr_value;
        }
      }
      
      return value;
    },
    
    // Uses data() to find a <td>'s name and type. Attempts to find missing
    // data by traversing up the associated column and looking in the first
    // <th> or the first <td>. If no name is found, type will be used. If no
    // type is found, "text" will be used.
    
    columnData: function(td) {
      var self = this, data = {}, value, column, tdh;
      
      td = $(td);
      column = this.column(td);
      
      $.each(['type', 'name'], function(index, key) {
        
        // Look in <td>
        value = self.data(td, key);
        
        // Traverse up column and look in <td> or <th>
        if (! value) {
          tdh = td.parents('table:first')
            .find('tr:first')
            .children()
            .eq(column);
          
          value = self.data(tdh, key);
        }
        
        data[key] = value;
      });

      // Set column
      data.column = self.column(td);
      
      // Use defaults
      if (! data.type ) {
        data.type = DEFAULT_TYPE;
      }
      
      if (! data.name) {
        data.name = data.type + '-' + data.column;
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
      var self = this, td, data, type, result;
      $(row).children('td').each(function() {
        td = $(this);
        data = $.livetable.columnData(td);
        
        if (self.hasType(data.type)) {  
          type = self._types[data.type];
          
          if (form == 'fields') {
            td.data(KEY + '.oldhtml', td.html());
            result = type.to_field(data, td);
          }
          if (form == 'text') {
            result = type.to_text(data, td, td.data(KEY + '.oldhtml'));
          }
        } else {
          throw 'Livetable: invalid type "' + data.type + '"';
        }
        
        td.html(result);
      });
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
    
    _create: function(table, options) {
      table = $(table);
      table.data(KEY, new Livetable(table, options));
    },
    
    // Get an instance of Livetable stored in a table element.
    // Returns false if no instance found.
    
    _get: function(table) {
      table = $(table);
      if (typeof(table.data(KEY)) == 'object') {
        return table.data(KEY);
      }
      return false;
    }
  };
  
  // Livetable
  
  function Livetable(table, options) {
    this.table     = $(table);
    this.disabled  = false;
    this.options   = $.extend($.livetable._default, options);
    this.id        = Math.ceil(Math.random() * 10 * 1000000);
    this.namespace = '.' + KEY + '.' + this.id;
    this._setupEvents();
  }
  
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
      this.deselect();
      this.table.removeData(KEY);
      $('*').unbind(this.namespace);
    },
    
    select: function(row, event) {
      if (this.disabled) {
        return null;
      }
      row = this._findRow(row);
      if (row) {
        // If the row is not already selected, and deselecting other
        // rows doesn't return false, and the beforeSelect callback
        // doesn't return false.
        
        if (! row.is('.' + this.options.selectedClass) && this.deselect() !== false && this._trigger('beforeSelect', row, event) !== false) {  
          row.addClass(this.options.selectedClass);
          
          $.livetable.rowToFields(row);
          
          // Use remember plugin if it exists
          if ($.fn.remember && this.options.rememberChanges) {
            row.remember();
          }
          
          this._trigger('onSelect', row);
          return true;
        } else {
          return false;
        }
      }
      return null;
    },
    
    deselect: function(row, event) {
      if (this.disabled) {
        return null;
      }
      
      if (row) {
        row = this._findRow(row);
      } else {
        row = this._currentRow(row);
      }
      
      if (row) {
        if (this._trigger('beforeDeselect', row, event) !== false) {
          row.removeClass(this.options.selectedClass);
          $.livetable.rowToText(row);
          this._trigger('onDeselect', row);
          return true;
        } else {
          return false;
        }
      }
      return null;
    },
    
    // Triggers an event callback. Returns result of callback, if callback
    // was found. Returns null otherwise.
    
    _trigger: function() {
      arguments = $.makeArray(arguments);
      var callback = this.options[arguments[0]];
      arguments.shift();
      
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
      
      row.parents('table').each(function(){
        if ($(this)[0] == self.table[0]) {
          inside_table = true;
        }
      });
      
      if (row.length && inside_table) {
        return row;
      }
      return false;
    },
    
    _setupEvents: function() {
      var self = this;
      
      // Select
      this.table.find('tr').bind('click' + this.namespace, function(event) {
        self.select(event.target, event);
      });
      
      // Deselect
      $('body').bind('click' + this.namespace, function(event) {
        if (! self._findRow(event.target)) {
          self.deselect(null, event);
        }
      });
    }
  });

  // Setup default types
  
  // Text
  
  $.livetable.addType('text', function(data, td) {
    return $('<input />').attr({
      type: 'text',
      name:  data.field_name,
      id:    data.field_name,
      value: td.text()
    });
  }, function(data, td, old_contents) {
    return td.find(':input').val();
  });

  // Textarea

  $.livetable.addType('textarea', function(data, td) {
    return $('<textarea></textarea>').attr({
      type: 'text',
      name:  data.field_name,
      id:    data.field_name
    }).text(td.text());
  }, function(data, td, old_contents) {
    return td.find(':input').text();
  });
  
  
  // Plugin
  
  $.fn.livetable = function() {
    var first = arguments[0], second = arguments[1], third = arguments[2], options, method, lt;
    
    if (first != 'options') {
      method = first;
      
      // If we need to return something specific, call method on first element
      if ($.inArray(method, $.livetable._return_methods) >= 0) {
        lt = $.livetable._get(this);
        if (lt) {
          return lt[method]();
        }
      }
      // Otherwise, loop through all matched elements and return jQuery object
      else {
        if (typeof(method) == 'object') {
          options = method;
        }
        
        $(this).each(function(){
          // Create
          if (options || method == '') {
            $.livetable._create(this, options);
          }
          else {
            lt = $.livetable._get(this);
            if ($.inArray(method, $.livetable._methods) >= 0 && lt) {
              lt[method](second);
            }
          }
          
        });
        return this;
      }
    }
    return null;
  };
  
})(jQuery);