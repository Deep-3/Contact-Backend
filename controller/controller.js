
const asyncHandler = require('express-async-handler');
const contact = require('../models/contactsModel')
const VCard = require('vcf')
const fs = require('fs');
const Vparse = require('vcard-parser');
const vCardsJS = require('vcards-js');
/**
 *
 * since mongoose and mongo DB work with promises we need to either handle promises
 * using .then() syntax or we can use the async await syntax either way we will need 
 * to write the error handling catch block to handle errors 
 * this is where express async handler comes in 
 * we can acquire the express async handler and simply wrap our async functions using the acquired object
 * doing this you don't need to worry about try catch block now express async handler will take care of it 
 */

const mongooseObj = require('../models/contactsModel');
const { compareSync } = require('bcrypt');
const userModel = require('../models/userModel');
const { console } = require('inspector');
/*
Since we will be interacting with mongo DB we will need to handle promises since mongo DB gives responses in promise format 
to handle promises we will be using async await methodology
but to catch errors while using this technique we will need to use try catch block 
and wrapping all functions in try catch block can be hectic and takes a lot of code\
A better approach is to use a middleware called express-async-handler

wrapping our async controller functions in this middleware will let us handle error without the need to actually declare a try catch block 
we just need to acquire the middleware after installing it from NPM and wrapp our async functions in it 
*/

//@desc Get all contacts
//@route GET /api/getContacts
//@Access private 
const getContacts = asyncHandler (async function(req,res){

    console.log("hit")
    const contacts = await mongooseObj.find({user_id: req.user.id});
    /**
     * if(Object.keys(contacts).length === 0){
        res.sendStatus(201).send("There are no records in database currently");
    }
     */

    if(Object.keys(contacts).length === 0){
        res.status(404)
        throw new Error("There are no records in database currently");
    }

    res.status(200).json(contacts);
}); 

//@desc Get indiviual contact
//@route GET /api/getContact/:id
//@Access private 

const getContact = asyncHandler (async function(req,res){
    const userInfo = await mongooseObj.findById(req.params.id);

    if(!userInfo){
        res.status(404);
        throw new Error("Sorry could not find record associated with provided ID")
    }

    if(userInfo.user_id.toString() !== req.user.id){
        res.status(401);
        throw new Error("Sorry you do not authorization to view this contact")
    }

    res.status(200).json(userInfo);
});

//@desc Get contacts by name
//@route GET /getContactbyName/:name
//@Access private 

const getContactbyName = asyncHandler (async function(req,res){
    let params = encodeURIComponent(req.params.name);
    console.log(params)
    const contacts = await mongooseObj.find({username : req.params.name});
    console.log(contacts)
    
    if(!contacts){
        res.status(404);
        throw new Error("Sorry could not find record associated with provided ID")
    }

    for(let i = 0 ; i < contacts.length ; i++){
        let userInfo = contacts[i];
        if(userInfo.user_id.toString() !== req.user.id){
            res.status(401);
            throw new Error("Sorry you do not authorization to view this contact")
        }
    }

    res.status(200).json(contacts);
});

//@desc Get contacts by phone number
//@route GET /api/getContactByPhoneNo/:phoneNumber
//@Access private 

const getContactbyPhoneNo = asyncHandler (async function(req,res){
    
    const contacts = await mongooseObj.find({phone : req.params.phone});
    

    if(!contacts || contacts.length === 0){
        res.status(404);
        throw new Error("Sorry could not find record associated with provided ID")
    }

    for(let i = 0 ; i < contacts.length ; i++){
        let userInfo = contacts[i];
        if(userInfo.user_id.toString() !== req.user.id){
            res.status(401);
            throw new Error("Sorry you do not authorization to view this contact")
        }
    }

    res.status(200).json(contacts);
});

//@desc Get contact by email
//@route GET /api/getContactbyName/:email
//@Access private 

const getContactbyEmail = asyncHandler (async function(req,res){
   
    const contacts = await mongooseObj.find({email : req.params.mail});
  
    if(!contacts){
        res.status(404);
        throw new Error("Sorry could not find record associated with provided ID")
    }

    for(let i = 0 ; i < contacts.length ; i++){
        let userInfo = contacts[i];
        if(userInfo.user_id.toString() !== req.user.id){
            res.status(401);
            throw new Error("Sorry you do not authorization to view this contact")
        }
    }

    res.status(200).json(contacts);
});

//@desc update indiviual contacts
//@route PUT /api/updateContact/:id
//@Access private 

const updateContact = asyncHandler(async function(req,res){
    console.log("here" + req.params.id);

    const userInfo = await mongooseObj.findOne({email:req.params.id});
    console.log(userInfo);
    console.log("not coming here");
    if(!userInfo){
        res.sendStatus(404);
        throw new Error("Sorry we have no contacts associated with given ID")
    }

    if(userInfo.user_id.toString() !== req.user.id){
        res.status(401);
        throw new Error("Sorry you do not authorization to update this contact")
    }
    
    const {name,email,phone} = req.body;
    if(!name || !email || !phone){
        res.status(400);
        throw new Error("All fields are mandatory");
    }

    const updatedUserInfo = await mongooseObj.findOneAndUpdate(
        {email:req.params.id},
        {
            "name":name,
            "email":email,
            "phone":phone,
        },
        {new:true}
    );

    res.status(200).json(updatedUserInfo);
});

//@desc Create indiviual contacts
//@route POST /api/createContact
//@Access private 

const createContact = asyncHandler(async function(req,res){
    const {name,email,phone} = req.body;

    if(!name || !email || !phone){
        res.status(400);
        throw new Error("All fields are mandatory, your obj was");
    }

    console.log(req.body);
    
    const userInfo = await mongooseObj.create({
        "username":name,
        email,
        phone,
        user_id:req.user.id
    });

    res.status(201).json(userInfo);
});

//@desc delete indiviual contacts
//@route DELETE /api/deleteContact/:id
//@Access private 

const delContact = asyncHandler(async function(req,res){
    console.log("Delete Api Hit")
    // console.log(req.params.phone)
    const phoneNumber = req.params.phone; // or req.body.phone if it's sent in the request body
    console.log(phoneNumber)
    const userInfo = await mongooseObj.findOne({ phone: phoneNumber });
    // console.log(userInfo)
    
    if(!userInfo){
        res.status(404);
        throw new Error("Sorry could not find record associated with provided ID");
    }

    if(req.user.id !== userInfo.user_id.toString()){
        res.status(403);
        throw new Error("You do not have access to delete this record");
    }
    console.log("i am ")

    const answer = await mongooseObj.deleteOne({phone: phoneNumber});
    res.status(200).json(userInfo);
});


const export_vcf = asyncHandler(async (req, res) => {
    try {
        const { user_id } = req.body;
        console.log(user_id)
        // Fetch multiple documents (assuming multiple contacts for a user)
        const contacts = await contact.find({ user_id: user_id });

        if (contacts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No contacts found!"
            });
        }

        // Array to hold all vCards
        let vCards = [];

        // Iterate over each contact and generate vCard
        contacts.forEach((data) => {
            const vCard = new VCard();
            vCard.set('fn', data.username);    // Full name
            vCard.set('email', data.email); // Email
            vCard.set('tel', data.phone);   // Phone number
            vCard.set('adr', data.address); // Address

            // Optional: Add more fields (e.g., organization, URL, etc.)
            // vCard.set('org', data.organization);

            // Add the vCard string to the array
            vCards.push(vCard.toString());
        });

        // Join all vCards into a single string
        const vCardString = vCards.join('\n');

        // Set the response headers for file download
        res.setHeader('Content-Type', 'text/vcard');
        res.setHeader('Content-Disposition', 'attachment; filename="contacts.vcf"');

        // Send the concatenated vCard content as the response
        return res.status(200).send(vCardString);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error!"
        });
    }
});


const import_vcf = asyncHandler(async (req, res) => {
    try {
        // Log the contacts received from the front-end
        const { contacts } = req.body; // Array of contacts from frontend
        console.log(contacts);

        // Check if there are any contacts
        if (!contacts || contacts.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid contacts found!"
            });
        }

        // Save contacts to MongoDB
        await contact.insertMany(contacts); // Insert contacts to MongoDB

        return res.status(201).json({
            success: true,
            message: `${contacts.length} contacts imported successfully!`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});



module.exports = {getContact,
                  getContacts,
                  updateContact,
                  createContact,
                  delContact,
                  getContactbyName,
                  getContactbyEmail,
                  getContactbyPhoneNo,
                export_vcf,import_vcf}



