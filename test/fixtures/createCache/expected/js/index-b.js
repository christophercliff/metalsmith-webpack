var _ = require('underscore')
var arr = require('./b')

var sum = _.reduce(arr, function(memo, val){
    return memo + val
}, 0)

console.log(sum)
