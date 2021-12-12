const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const Event = require('./models/event');
const app = express();
app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String
            price: Float!
            date: String!
        }

        input EventInput {
            title: String!
            description: String
            price: Float!
            date: String
        }

        type RootQuery {
            events: [Event!]!   
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event  
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find()
                .then(events => {
                    return events.map(event => {
                        return { ...event._doc, _id: event._id }
                    })
                })
                .catch(err => {
                    console.log(err);
                })
        },
        createEvent: (args) => {
            try {
                const event = new Event({
                    title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: +args.eventInput.price,
                    date: new Date().toISOString()
                });
                return event.save()
                    .then(result => {
                        console.log(result);
                        return { ...result._doc };
                    })
                    .catch(err => {
                        console.log(err);
                    });
            } catch (err) {
                console.log(Event);
                console.log(err);
            }
        }
    },
    graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@sandbox.lklze.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
    .then(() => {
        console.log(`Database ${process.env.MONGO_DB} Connected :: ${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}`);
        app.listen(`${process.env.SERVER_PORT}`);
        console.log(`Server Listening to port ${process.env.SERVER_PORT}`);
    })
    .catch(err => { console.log(err.stack) })

app.get('/', (req, res, next) => { res.send('Hello World') });
