var focusBottomLeftCell = function () {
    $('#focus').focus();
}

var is_int = function (value){ 
    if((parseFloat(value) == parseInt(value)) && !isNaN(value)){
        return true;
    } else { 
        return false;
    } 
}

ko.numericObservable = function (initialValue) { 
    var _actual = ko.observable(initialValue); 

    var result = ko.dependentObservable({ 
        read: function () { 
            return _actual(); 
        }, 
        write: function (newValue) { 
            var parsedValue = parseFloat(newValue); 
            _actual(isNaN(parsedValue) ? newValue : parsedValue); 
        } 
    }); 

    return result; 
};
var Prob = function (table) {
    this.x = ko.numericObservable();
    this.pOfX = ko.numericObservable();
    this.remove = function () {
        table.probs.remove(this);  
    }

    this.xValid = ko.dependentObservable(function () {
        return this.x() == null || this.x() == '' || !isNaN(this.x()) ;
    }, this);

    this.pValid = ko.dependentObservable(function () {
        return this.pOfX() == null || (0 <= this.pOfX() && this.pOfX() <= 1);
    }, this);
}

var Table = function () {
    var self = this;
    this.pendingProb = ko.observable(new Prob(this));
    this.buildFromQueryString = function () {
        var table = [];
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        if (vars[0] !== "") {
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                var p = new Prob(this);
                p.x(pair[0]);
                p.pOfX(pair[1]);
                table.push(p);
            }
        }

        return table;
    };
    this.probs = ko.observableArray(this.buildFromQueryString());

    this.entryKeyHandler = function (data, e) {
        if (e.keyCode == 9) {
            e.target.blur(); 
            self.pendingProb(new Prob(self));
            self.probs.push(data);
            focusBottomLeftCell();
        } else {
            return true;
        }
    };
    this.totalProb = function () {
        var total = 0;
        for(var  i = 0; i < this.probs().length; i++) {
            total += parseFloat(this.probs()[i].pOfX());
        }
        return total;
    };
    this.totalValid = ko.dependentObservable(function () {
        return this.totalProb().toPrecision(5) == 1;
    }, this);

};

var Simulation = function (table, results) {
    var self = this;
    this.valid = function () {
        var valid = true;
        for (var i = 0; i < table.probs().length; i++) {
            var p = table.probs()[i];
            valid = valid && p.xValid() && p.pValid();
        }

        valid = valid && table.totalValid() && is_int(this.trials()) && this.trials() <= 10000;

        return valid;
    };

    this.buildDist = function () {
        var dist = [];
        var runningFloor = 0.0;
        var ps = table.probs();
        for(var i = 0; i < ps.length; i++) {
            var p = ps[i];
            dist.push({floor: runningFloor, value: p.x(), ceiling: runningFloor += p.pOfX()});
        }
        return dist;
    };

    this.runSimulation = function (data, e) {
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
        results.results(result);
    };

    this.trials = ko.numericObservable(100);

    this.trialsValid = function () {
        return self.trials() <= 10000;
    };
};

var Results = function () {
        this.results = ko.observable('');
        this.selectText = function () {
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
        };
};

var ViewModel = function () {
    this.table = new Table();
    this.results = new Results();
    this.simulation = new Simulation(this.table, this.results);
}


ko.applyBindings(new ViewModel);
