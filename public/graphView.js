//If we have
var tPosts = tPosts;
console.log(tPosts)
if (tPosts){
    var nodes = new vis.DataSet({})
    for(post in tPosts){
        nodes.add([
            {id:post._id, label: post.text + "\nupvotes: " + post.upvotes + "\ndownvotes: " + post.downvotes}
        ]);
    }

    var edges = new vis.DataSet({})
    for(post in tPosts){
        for (child in post.children){
            edges.add([
                {id:post._id, to: child}
            ])
        }
    }
}



// // create an array with nodes
// var nodes = new vis.DataSet([
//     {id: 1, label: 'Node 1'},
//     {id: 2, label: 'Node 2'},
//     {id: 3, label: 'Node 3'},
//     {id: 4, label: 'Node 4'},
//     {id: 5, label: 'Node 5'}
// ]);

// // create an array with edges
// var edges = new vis.DataSet([
//     {from: 1, to: 3},
//     {from: 1, to: 2},
//     {from: 2, to: 4},
//     {from: 2, to: 5}
// ]);

// create a network
var container = document.getElementById('mynetwork');

// provide the data in the vis format
var data = {
    nodes: nodes,
    edges: edges
};

function draw() {
    console.log("Hello")
    // create a network
    var options = {
        manipulation: {
                addNode: function (data, callback) {
                // filling in the popup DOM elements
                document.getElementById('operation').innerHTML = "Add Node";
                document.getElementById('node-id').value = data.id;
                document.getElementById('node-label').value = data.label;
                document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
                document.getElementById('cancelButton').onclick = clearPopUp.bind();
                document.getElementById('network-popUp').style.display = 'block';
                },
                editNode: function (data, callback) {
                // filling in the popup DOM elements
                document.getElementById('operation').innerHTML = "Edit Node";
                document.getElementById('node-id').value = data.id;
                document.getElementById('node-label').value = data.label;
                document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
                document.getElementById('cancelButton').onclick = cancelEdit.bind(this,callback);
                document.getElementById('network-popUp').style.display = 'block';
                },
                addEdge: function (data, callback) {
                if (data.from == data.to) {
                    var r = confirm("Do you want to connect the node to itself?");
                    if (r == true) {
                    callback(data);
                    }
                }
                else {
                    callback(data);
                }
            }
        }
    };
    var network = new vis.Network(container, data, options);
}

function clearPopUp() {
    document.getElementById('saveButton').onclick = null;
    document.getElementById('cancelButton').onclick = null;
    document.getElementById('network-popUp').style.display = 'none';
}

function cancelEdit(callback) {
    clearPopUp();
    callback(null);
}

function saveData(data,callback) {
    data.id = document.getElementById('node-id').value;
    data.label = document.getElementById('node-label').value;
    clearPopUp();
    callback(data);
}

function init() {
    draw();
}

init()