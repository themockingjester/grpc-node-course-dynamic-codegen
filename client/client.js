const path = require('path')
const protoLoader = require('@grpc/proto-loader') //require('@grpc/proto-loader')
const grpc = require('grpc')


//grpc service definition for greet

const greetProtoPath = path.join(__dirname, "..", "protos", "greet.proto")
const greetProtoDefinition = protoLoader.loadSync(greetProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const greetPackageDefinition = grpc.loadPackageDefinition(greetProtoDefinition).greet

const client = new greetPackageDefinition.GreetService("localhost:50051",
    grpc.credentials.createInsecure()
)

//  For unary server demo
function callGreeting() {
    var request = {
        greeting: {
            first_name: "Jerry",
            last_name: "Tom"
        }
    }
    client.greet(request, (error, response) => {
        if (!error) {
            console.log("Greeting Response: ", response.result);


        } else {
            console.error(error)


        }
    })
}

// For server streaming server demo
function callMultipleGreeting() {
    var request = {
        greeting: {
            first_name: "Jerry",
            last_name: "Tom"
        }
    }
    let call = client.sendMultipleGreetings(request, () => {
    })

    call.on('data', (response) => {
        console.log("Client streaming response: " + response.result);
    })
    call.on('status', (status) => {
        console.log(status);
    })
    call.on('error', (error) => {
        console.error("Client streaming error: " + error);
    })
    call.on('end', (error) => {
        console.error("Streamingg Ended");
    })
}

// For client streaming demo
function sendMultipleGreeting() {
    let count = 0
    var request = {
        greeting: {
            first_name: "Jerry",
            last_name: "Tom"
        }
    }
    let call = client.ReceiveMultipleGreetings(request, (error, response) => {
        if (!error) {
            console.log("Response: " + response.result);
        } else {
            console.log("Error: " + error);
        }
    })
    let intervalId = setInterval(() => {
        var request = {
            greeting: {
                first_name: "Jerry",
                last_name: "Tom"
            }
        }
        call.write(request)

        if (count > 10) {
            clearInterval(intervalId)
            call.end()
        }
        count++
    }, 500)



    
}


function main() {
    // callGreeting()
    // callMultipleGreeting()
    sendMultipleGreeting()
}
main()