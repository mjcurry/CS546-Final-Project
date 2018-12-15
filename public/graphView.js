//If we have
var tPosts = tPosts;
var threadID = threadID;

if (tPosts){
    var nodes = new vis.DataSet({})
    for(i=0; i<tPosts.length; i++){
        nodes.add([
            {id:tPosts[i]._id, label: tPosts[i].text + "\nupvotes: " + tPosts[i].upvotes + "\ndownvotes: " + tPosts[i].downvotes}
        ]);
    }

    var edges = new vis.DataSet({})
    let childrenAdded = []
    for(i=0; i<tPosts.length; i++){
        if (tPosts[i].thread !== tPosts[i]._id){
            if(tPosts[i].children.length !== 0){
                for (j=0; j<tPosts[i].children.length; j++){
                    edges.add([
                        {from:tPosts[i]._id, to: tPosts[i].children[j]}
                    ])
                    childrenAdded.push(tPosts[i].children[j])
                }
            }
        }
    }
    
    for(i=0; i<tPosts.length; i++){
        if (tPosts[i].thread !== tPosts[i]._id){
            if(childrenAdded.includes(tPosts[i]._id) == false){
                edges.add([
                    {from:tPosts[i].thread, to: tPosts[i]._id}
                ])
            }
        }
    }
}

// create a network
var container = document.getElementById('mynetwork');
var network = null

// provide the data in the vis format
var data = {
    nodes: nodes,
    edges: edges
};

function draw() {
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
        },
        edges: {
            font: {
                size: 12
            },
            widthConstraint: {
                maximum: 200
            }
        },
        nodes: {
            shape: 'box',
            margin: 10,
            widthConstraint: {
                maximum: 200
            }
        }   
    };
    network = new vis.Network(container, data, options);
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

let selectedNode = null
function post() {
    textbox = document.getElementById('ptext')
    
    dataToSend = {
        comment: textbox.value,
        thread: threadID,
        parentNode: selectedNode
    }
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", 'post');
    form.setAttribute("action", '/newComment');

    for(var key in dataToSend) {
        if(dataToSend.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", dataToSend[key]);

            form.appendChild(hiddenField);
        }
    }

    document.getElementById("PostForm").appendChild(form)
    form.submit();
}

function deleteComment() {
    dataToSend = {
        thread: threadID,
        selectedComment: selectedNode
    }
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", 'post');
    form.setAttribute("action", '/deleteComment');

    for(var key in dataToSend) {
        if(dataToSend.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", dataToSend[key]);

            form.appendChild(hiddenField);
        }
    }

    document.getElementById("PostForm").appendChild(form)
    form.submit();
}

function upVoteComment() {
    dataToSend = {
        thread: threadID,
        selectedComment: selectedNode,
        amount: 1
    }
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", 'post');
    form.setAttribute("action", '/voteComment');

    for(var key in dataToSend) {
        if(dataToSend.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", dataToSend[key]);

            form.appendChild(hiddenField);
        }
    }
    document.getElementById("PostForm").appendChild(form)
    form.submit();
}

function downVoteComment() {
    dataToSend = {
        thread: threadID,
        selectedComment: selectedNode,
        amount: -1
    }
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", 'post');
    form.setAttribute("action", '/voteComment');

    for(var key in dataToSend) {
        if(dataToSend.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", dataToSend[key]);

            form.appendChild(hiddenField);
        }
    }
    document.getElementById("PostForm").appendChild(form)
    form.submit();
}

function handleNodeClick(){
    let node = network.getSelectedNodes()
    if (node){
        selectedNode = node[0]
    }
}

init()