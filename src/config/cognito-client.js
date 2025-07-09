import express from 'express';
import session from 'express-session';
import { Issuer, generators } from 'openid-client';
const app = express();

let client;
// Initialize OpenID Client
async function initializeClient() {
    const issuer = await Issuer.discover('https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_xL7ZINqxQ');
    client = new issuer.Client({
        client_id: '4c3p9pmsfih5ir9613bnl8rg9n',
        client_secret: '<client secret>',
        redirect_uris: ['https://d84l1y8p4kdic.cloudfront.net'],
        response_types: ['code']
    });
};
initializeClient().catch(console.error);