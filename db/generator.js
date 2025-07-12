import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import fs from 'fs';
import mongoose from 'mongoose';
import readline from 'readline';

const projectSchema = new mongoose.Schema({
    project_name: String,
    description: String,
    status_types: Array,
});

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password_hash: String,
    role: String,
});

const issueSchema = new mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    reporter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status_history: [{
        status_id: {
            type: Number,
            ref: 'Status',
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        }
    }],
    title: String,
    description: String,
    charm: String,
    created_at: Date,
    updated_at: Date,
    occurrences: Array,
    attachments: Array,
    comments: Array,
});

// Constants for the number of each type of data
const numProjects = 2;
const numUsers = 10;
const numIssues = 20;
const numOccurrences = 5;
const numAttachments = 2;
const numComments = 5;
const numStatusChanges = 3;

const Project = mongoose.model('Project', projectSchema);
const User = mongoose.model('User', userSchema);
const Issue = mongoose.model('Issue', issueSchema);

// Custom replacer function to handle ObjectId instances
function objectIdReplacer(_, value) {
    if (value instanceof mongoose.Types.ObjectId) {
        return `ObjectId("${value.toHexString()}")`;
    }
    return value;
}

// Function to generate fake data
async function generateFakeData() {
    // Generate fake users
    const users = [];
    const userPasswords = {}; // Lookup dictionary for user passwords
    for (let i = 0; i < numUsers; i++) {
        const password = faker.internet.password();
        const password_hash = await bcrypt.hash(password, 10);
        const user = new User({
            username: faker.internet.userName(),
            email: faker.internet.email(),
            password_hash,
            role: faker.helpers.arrayElement(['admin', 'user'])
        });
        users.push(user);
        userPasswords[user.username] = password;
    }

    // Generate fake projects and related data
    const projects = [];
    const issues = [];
    for (let i = 0; i < numProjects; i++) {
        const project = new Project({
            project_name: faker.company.name(),
            description: faker.company.catchPhrase(),
            status_types: [
                { status_id: 1, status_name: 'Open' },
                { status_id: 2, status_name: 'In Progress' },
                { status_id: 3, status_name: 'Closed' },
                { status_id: 4, status_name: 'Cancelled' }
            ]
        });
        projects.push(project);

        // Generate issues for each project
        for (let j = 0; j < numIssues; j++) {
            const status_history = Array.from({ length: numStatusChanges }, () => ({
                status_id: faker.helpers.arrayElement([1, 2, 3, 4]),
                date: faker.date.past()
            })).sort((a, b) => a.date - b.date);

            const issue = new Issue({
                project_id: project._id,
                reporter_id: faker.helpers.arrayElement(users)._id,
                status_history,
                title: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                charm: Math.random() < 0.7
                    ? faker.internet.emoji()
                    : faker.random.alphaNumeric(1).toLowerCase(),
                created_at: faker.date.past(),
                updated_at: faker.date.recent(),
                occurrences: Array.from({ length: numOccurrences }, () => ({
                    _id: new mongoose.Types.ObjectId(),
                    description: faker.company.bs(),
                    created_at: faker.date.past(),
                    updated_at: faker.date.recent()
                })),
                attachments: Array.from({ length: numAttachments }, () => ({
                    _id: new mongoose.Types.ObjectId(),
                    user_id: faker.helpers.arrayElement(users)._id,
                    file_path: faker.system.filePath(),
                    created_at: faker.date.past()
                })),
                comments: Array.from({ length: numComments }, () => ({
                    _id: new mongoose.Types.ObjectId(),
                    user_id: faker.helpers.arrayElement(users)._id,
                    comment_text: faker.music.songName(),
                    created_at: faker.date.past()
                }))
            });
            issues.push(issue);
        }
    }

    // Ensure the generated folder exists
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    if (!fs.existsSync('generated/scripts')) {
        fs.mkdirSync('generated/scripts');
    }

    // Write data to files in the generated folder using the objectIdReplacer
    fs.writeFileSync('generated/projects.json', JSON.stringify(projects, objectIdReplacer, 2));
    fs.writeFileSync('generated/users.json', JSON.stringify(users, objectIdReplacer, 2));
    fs.writeFileSync('generated/issues.json', JSON.stringify(issues, objectIdReplacer, 2));

    // Create a modified user collection with passwords
    const usersWithPasswords = users.map(user => ({
        ...user.toObject(),
        password: userPasswords[user.username]
    }));
    fs.writeFileSync('generated/users_with_passwords.json', JSON.stringify(usersWithPasswords, objectIdReplacer, 2));

    return { projects, users, issues };
}

// Convert the collections to MongoDB insertMany statements
function generateInsertManyStatements(collectionName, documents) {
    return `db.${collectionName}.insertMany(${JSON.stringify(documents, objectIdReplacer, 2)});`;
}

// Generate and save the insert scripts
async function generateInsertScripts() {
    const { projects, users, issues } = await generateFakeData();

    const projectInserts = generateInsertManyStatements('projects', projects);
    const userInserts = generateInsertManyStatements('users', users);
    const issueInserts = generateInsertManyStatements('issues', issues);

    fs.writeFileSync('generated/scripts/projectInserts.js', projectInserts);
    fs.writeFileSync('generated/scripts/userInserts.js', userInserts);
    fs.writeFileSync('generated/scripts/issueInserts.js', issueInserts);

    return { projects, users, issues };
}

async function runScripts() {
    const { projects, users, issues } = await generateInsertScripts();

    console.log('Insert scripts generated successfully!');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Would you like to log the generated data to the console? [y]es/[N]o: ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            console.log('Projects:', projects);
            console.log('Users:', users);
            console.log('Issues:', issues);
        }

        rl.question('Do you want to connect to MongoDB and run the scripts now? This will nuke the current data! [y]es/[N]o: ', async (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                try {
                    await mongoose.connect('mongodb+srv://iit:LfdTdr1hEKkSNIoF@intermittentissuetracke.7oyxe.mongodb.net/?retryWrites=true&w=majority&appName=IntermittentIssueTracker', { useNewUrlParser: true, useUnifiedTopology: true });
                    console.log('MongoDB Connected...');

                    console.log('Dropping all collections...');
                    const collections = await mongoose.connection.db.collections();
                    for (let collection of collections) {
                        await collection.drop();
                        console.log(`\tDropped collection: ${collection.collectionName}`);
                    }

                    console.log('Inserting data...');
                    console.log(`\tInserting ${numProjects} projects...`);
                    await Project.insertMany(projects);
                    console.log(`\tInserting ${numUsers} users...`);
                    await User.insertMany(users);
                    console.log(`\tInserting ${numIssues} issues...`);
                    await Issue.insertMany(issues);

                    console.log('Data inserted successfully!');
                } catch (err) {
                    console.error('Error connecting to MongoDB or inserting data:', err.message);
                } finally {
                    mongoose.connection.close();
                }
            } else {
                console.log('You can run the scripts manually later.');
            }
            rl.close();
        });
    });
}

runScripts();