//Dont use usestrict here or the evaluator will break
/**
 * Common functions accessible from the user's Javascript eval environment
 * (for use within their formulas).
 */
 //TODO: These functions need unit testing.
define(['opendatakit','database', 'underscore'],
function(opendatakit,  database,   _) {
    verifyLoad('formulaFunctions',
        ['opendatakit','database', 'underscore'],
        [opendatakit,  database,   _]);
    return {
        //calculates will be set by the builder
        calculates: {},
        opendatakit: opendatakit,
        localize: function(textOrLangMap, locale) {
            if(_.isUndefined(textOrLangMap)) {
                return 'text_undefined';
            }
            if(_.isString(textOrLangMap)) {
                return textOrLangMap;
            }
            if( locale in textOrLangMap ) {
                return textOrLangMap[locale];
            } else if( 'default' in textOrLangMap ) {
                return textOrLangMap['default'];
            } else {
                shim.log('E',"Could not localize object. Locale '" + locale + 
                    "' and 'default' missing from " + textOrLangMap);
                throw new Error("Could not localize object. Locale '" + locale + 
                    "' and 'default' missing from: " + textOrLangMap );
            }
        },
        selected: function(promptValue, qValue) {
            if(!promptValue) {
                return false;
            }
            // it is a select_multiple...
            if(_.isArray(promptValue)) {
                return _.include(promptValue, qValue);
            }
            // it is a select_one...
            //Using double equals here because I suspect the type coercion will prevent more
            //user errors that it will cause when comparing numbers and strings.
            return promptValue == qValue;
        },
        countSelected: function(promptValue){
            // select_multiple promptValue is an array
            if(!promptValue) {
                return 0;
            }
            if(!_.isArray(promptValue)) {
                shim.log('E','countSelected() expects an array. Received: ' + promptValue );
                throw new Error("countSelected() expects an array.  Received: '" + promptValue + "'");
            }
            return promptValue.length;
        },
        //Check if the prompts have equivalent values.
        equivalent: function() {
            var parsedArgs = arguments;
            if(_.all(parsedArgs, _.isArray)) {
                //We are probably dealing with a select. values is an array of the selected values.
                var values = parsedArgs;
                return _.all(values.slice(1), function(value) {
                    return _.union(_.difference(value, values[0]), _.difference(values[0], value)).length === 0;
                });
            } else {
                var arg0 = parsedArgs[0];
                return _.all(parsedArgs, function(argument) {
                    return _.isEqual(arg0, argument);
                });
            }
        },
        not: function(conditional) {
            return !conditional;
        },
        now: function() {
            return new Date();
        },
        isFinalized: function() {
            var datavalue = database.getInstanceMetaDataValue('_savepoint_type');
            return ( 'COMPLETE' === datavalue );
        },
        //data gets a value by name.
        data: function(valueName) {
            var datavalue = database.getDataValue(valueName);
            return datavalue;
        },
        /**
         * assignment operator that returns the value that was assigned.
         * i.e., assign('a', 3) will store the value 3 in data('a') and
         * return the value 3 (for use in the remainder of the expression).
         */
        assign: function(valueName, value) {
            database.setValueDeferredChange(valueName, value);
            return value;
        },
        /**
         * evaluator takes a string of code and evaluates in an environment with
         * all the formula functions.
         * This is used for evaluating user specified constraints/calculates/etc.
         * from formDef.json
         **/
        evaluator: function(code){
            //Both `with` and `eval` are cautioned against.
            //The justification for using eval is that we need some way to evaluate
            //user provided code. We are presuming that the survey creator is trusted
            //by the survey user. If not, bundled templates and promptTypes
            //are also security problems.
            //`with` is used to avoid having to repeatedly define every formula function.
            //formulaFuctions need to be available as module for use in our code
            //and in the top level environment for user provided code.
            //Be sure to NOT use strict in this module or `with` won't work.
            with(this){
                return eval(code);
            }
        }
    };
});