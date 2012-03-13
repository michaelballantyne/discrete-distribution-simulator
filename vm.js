function focusBottomLeftCell() {
    $('#focus').focus();
}

function selectText() {
    if (document.selection) {
        var range = document.body.createTextRange();
        range.moveToElementText(document.getElementById('selectable'));
        range.select();
    }
    else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(document.getElementById('selectable'));
        window.getSelection().addRange(range);
    }
}

function is_int(value){ 
    if((parseFloat(value) == parseInt(value)) && !isNaN(value)){
        return true;
    } else { 
        return false;
    } 
}

ko.numericObservable = function(initialValue) { 
    var _actual = ko.observable(initialValue); 
    var result = ko.dependentObservable({ 
        read: function() { 
            return _actual(); 
        }, 
        write: function(newValue) { 
            var parsedValue = parseFloat(newValue); 
            _actual(isNaN(parsedValue) ? newValue : parsedValue); 
        } 
    }); 
    return result; 
};
var prob = function() {
    var p = {
        x : ko.numericObservable(),
        pOfX : ko.numericObservable(),

        remove : function() {  viewModel.probs.remove(this);  }
    };	

    p.xValid = ko.dependentObservable(function() {
        return p.x() == null || p.x() == '' || !isNaN(p.x()) ;
    }, viewModel);
    p.pValid = ko.dependentObservable(function() {
        return p.pOfX() == null || (0 <= p.pOfX() && p.pOfX() <= 1);
    }, viewModel);

    return p;

}

function buildTableFromQueryString() {
    var table = [];
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        var p = new prob();
        p.x(pair[0]);
        p.pOfX(pair[1]);
        table.push(p);
    }

    if (table.length == 0)
        table.push(new prob());
    return table;
}

var viewModel = {
    probs: ko.observableArray(buildTableFromQueryString()),
    addProb: function() {
        this.probs.push(new prob());
    },
    trials: ko.numericObservable(100),
    valid: function() {
        var valid = true;
        for (var i = 0; i < this.probs().length; i++) {
            var p = this.probs()[i];
            valid = valid && p.xValid() && p.pValid();
        }

        valid = valid && this.totalValid() && is_int(this.trials()) && this.trials() <= 10000;

        return valid;
    },
    buildDist: function() {
        var dist = [];
        var runningFloor = 0.0;
        var ps = this.probs();
        for(var i = 0; i < ps.length; i++) {
            var p = ps[i];
            dist.push({floor: runningFloor, value: p.x(), ceiling: runningFloor += p.pOfX()});
        }
        return dist;
    },
    runSimulation: function() {
        if (!this.valid()) {
            alert("It looks like you haven't entered all the right data for the simulation. Please correct those fields highlighted in red or any you may have left empty.");
            return;
        }
        var dist = this.buildDist();
        var result = [];
        for(var j = 0; j < this.trials(); j++) {
            var rand = Math.random();
            for(var i = 0; i < dist.length; i++) {
                if (rand < dist[i].ceiling && rand >= dist[i].floor) {
                    result.push(dist[i].value);
                    break;
                }
            }
        }
        this.results(result);
    },
    results: ko.observable(''),
    selectText: function() {
        if (document.selection) {
            var range = document.body.createTextRange();
            range.moveToElementText(document.getElementById('selectable'));
            range.select();
        }
        else if (window.getSelection) {
            var range = document.createRange();
            range.selectNode(document.getElementById('selectable'));
            window.getSelection().addRange(range);
        }
    }
}

viewModel.totalProb = ko.dependentObservable(function() {
    var total = 0;
    for(var  i = 0; i < this.probs().length; i++) {
        total += parseFloat(this.probs()[i].pOfX());
    }
    return total;
}, viewModel);

viewModel.totalValid =  ko.dependentObservable(function() {
    return this.totalProb().toPrecision(5) == 1;
}, viewModel);


ko.applyBindings(viewModel);

