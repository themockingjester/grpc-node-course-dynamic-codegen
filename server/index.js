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


// For unary server demo (similar to rest api)
function greet(call, callback) {
    let firstName = call.request.greeting.first_name;
    var lastName = call.request.greeting.last_name;

    callback(null, { result: "Hello " + firstName + " " + lastName })

}


// For server streaming demo
function greetMany(call, callback) {
    let firstName = call.request.greeting.first_name;
    let lastName = call.request.greeting.last_name;
    let count = 0

    let interval = setInterval(() => {
        let greetManyTimesResponse = greetPackageDefinition.SendManyGreetingsResponse
        greetManyTimesResponse.result = "Hello " + firstName + " " + lastName
        call.write(greetManyTimesResponse)

        if (count > 10) {
            clearInterval(interval)
            // ending stream
            call.end()
        }
        count += 1
    }, 1000)




}

// For client streaming
function receiveManyGreet(call, callback) {
    let gotError = false
    call.on('data', (request) => {
        let firstName = request.greeting.first_name;
        let lastName = request.greeting.last_name;

        console.log(firstName, 23, typeof (firstName))
        // Error handling
        if (firstName == "" || firstName == undefined) {
            let serverResponse = greetPackageDefinition.GreetResponse
            serverResponse.result = "Failed "
            gotError = true
            return callback({
                code: grpc.status.CANCELLED,
                message: "Cancelled"
            })

        } else {
            console.log("Received : " + firstName + ", " + lastName);

        }

    })
    call.on('error', (error) => {
        console.error("Server streaming error: " + error);
    })
    call.on('end', () => {
        console.error("Streaming Ended");
        if (gotError) {
            // nothing to do here
        } else {
            let serverResponse = greetPackageDefinition.GreetResponse
            serverResponse.result = "Thanks For sending data "
            callback(null, serverResponse)
        }


    })
}

// For bi directional streaming
function biDirectionMultipleGreets(call, callback) {
    call.on('data', (request) => {
        let firstName = request.greeting.first_name;
        let lastName = request.greeting.last_name;
        let greetManyTimesResponse = greetPackageDefinition.SendManyGreetingsResponse
        greetManyTimesResponse.result = "Hello " + firstName + " " + lastName
        call.write(greetManyTimesResponse)
        console.log("Received : " + firstName + ", " + lastName);
    })
    call.on('error', (error) => {
        console.error("Server streaming error: " + error);
    })
    call.on('end', () => {
        console.error("Streaming Ended");
        let serverResponse = greetPackageDefinition.SendManyGreetingsResponse
        serverResponse.result = "Thanks For sending data "
        call.write(serverResponse)
        call.end()

    })



}

function main() {
    const server = new grpc.Server()

    server.addService(greetPackageDefinition.GreetService.service, {
        greet: greet,
        sendMultipleGreetings: greetMany,
        receiveMultipleGreetings: receiveManyGreet,
        biDirectionMultipleGreets: biDirectionMultipleGreets
    })

    server.bind("127.0.0.1:50051", grpc.ServerCredentials.createInsecure())
    server.start()
    console.log("Server Runnig at http://127.0.0.1:50051")



}
main()