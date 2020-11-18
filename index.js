const WebSocket = require('ws')

module.exports = ({ app }) => {

    app.on(['issues.opened'], async context => {
        await generateResponse(context, context.payload.issue.body)
    })

    app.on(['issue_comment.created'], async context => {

        if (context.payload.comment.user.login === 'xrpl-bot[bot]') {
            // We only need to be parsing comments created by others
            return;
        }

        await generateResponse(context, context.payload.comment.body)
    })
}

let generateResponse = async function(context, body) {

    // Let's first check for the @mention of @xrpl-bot
    let mention = body.match(/(@xrpl\-bot)/i)

    if (mention === null) {
        console.log('could not locate a metion of the bot');
        // There was no mention of the bot, exiting
        return;
    }

    let hash = body.match(/([\dA-Z]){64}/)

    if (hash === null) {
        console.log('could not find a transaction hash');
        // We couldn't detect a transaction hash, exiting
        return;
    }

    hash = hash[0];

    let response = await getTransaction(hash);
    let commentDetails = [];

    if (response.status === 'error') {
        commentDetails.push("# Internal Error - Transaction Details");
        commentDetails.push("The transaction could not be returned at this time.");
    } else {
        commentDetails.push("# Transaction Details");
        commentDetails.push("**Hash:** [" + hash + "](https://bithomp.com/explorer/" + hash + ")");
        commentDetails.push.apply(commentDetails, buildGeneralDetailsTable(response.result));
        commentDetails.push.apply(commentDetails, buildDetailExplanationForTransactionType(response.result));
        commentDetails.push("## Transaction JSON");
        commentDetails.push("``` js ");
        commentDetails.push(JSON.stringify(response.result, null, 2))
        commentDetails.push("```");
    }

    const issueComment = context.issue({ body: commentDetails.join("\n") });
    return context.github.issues.createComment(issueComment);
};

let buildGeneralDetailsTable = function(result)
{
    var commentDetails = [];
    commentDetails.push("| Property | Value |");
    commentDetails.push("| :--- | :--- |");
    commentDetails.push("| Type | " + result.TransactionType + " |");
    commentDetails.push("| Initiated By | " + linkToExplorer(result.Account) + " |");
    commentDetails.push("| Sequence | " + result.Sequence + " |");
    commentDetails.push("| XRPL fee | " + (result.Fee / 1000000) + " XRP |");
    commentDetails.push("| Validated | *" + (result.validated ? 'true' : 'false') + "* |");
    commentDetails.push("");

    return commentDetails;
};

// Function to handle routing to the correct transaction type handler
let buildDetailExplanationForTransactionType = function(result)
{
    switch (result.TransactionType) {
        case 'AccountSet':
            return buildNoSupportedExplanation(result);
            //return buildDetailedAccountSetExplanation(result);

        case 'AccountDelete':
            return buildNoSupportedExplanation(result);
            //return buildDetailedAccountDeleteExplanation(result);

        case 'CheckCancel':
            return buildNoSupportedExplanation(result);
            //return buildDetailedCheckCancelExplanation(result);

        case 'CheckCash':
            return buildNoSupportedExplanation(result);
            //return buildDetailedCheckCashExplanation(result);

        case 'CheckCreate':
            return buildNoSupportedExplanation(result);
            //return buildDetailedCheckCreateExplanation(result);

        case 'DepositPreauth':
            return buildNoSupportedExplanation(result);
            //return buildDetailedDepositPreauthExplanation(result);

        case 'EscrowCancel':
            return buildNoSupportedExplanation(result);
            //return buildDetailedEscrowCancelExplanation(result);

        case 'EsrowCreate':
            return buildNoSupportedExplanation(result);
            //return buildDetailedEscrowCreateExplanation(result);

        case 'EscrowFinish':
            return buildNoSupportedExplanation(result);
            //return buildDetailedEscrowFinishExplanation(result);

        case 'OfferCancel':
            return buildNoSupportedExplanation(result);
            //return buildDetailedOfferCancelExplanation(result);

        case 'OfferCreate':
            return buildNoSupportedExplanation(result);
            //return buildDetailedOfferCreateExplanation(result);

        case 'Payment':
            return buildDetailedPaymentExplanation(result);

        case 'PaymentChannelClaim':
            return buildNoSupportedExplanation(result);
            //return buildDetailedPaymentChannelClaimExplanation(result);

        case 'PaymentChannelCreate':
            return buildNoSupportedExplanation(result);
            //return buildDetailedPaymentChannelCreateExplanation(result);

        case 'PaymentChannelFund':
            return buildNoSupportedExplanation(result);
            //return buildDetailedPaymentChannelFundExplanation(result);

        case 'SetRegularKey':
            return buildNoSupportedExplanation(result);
            //return buildDetailedSetRegularKeyExplanation(result);

        case 'SignerListSet':
            return buildNoSupportedExplanation(result);
            //return buildDetailedSignerListSetExplanation(result);

        case 'TrustSet':
            return buildNoSupportedExplanation(result);
            //return buildDetailedTrustSetExplanation(result);
    }
};

let buildNoSupportedExplanation = function(result)
{
    var commentDetails = [];

    commentDetails.push("");
    commentDetails.push("The transaction type of **`" + result.TransactionType + "`** is not currently supported for a detailed explanation.");
    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: AccountSet
let buildDetailedAccountSetExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: AccountDelete
let buildDetailedAccountDeleteExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: CheckCancel
let buildDetailedCheckCancelExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: CheckCash
let buildDetailedCheckCashExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: CheckCreate
let buildDetailedCheckCreateExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: DepositPreauth
let buildDetailedDepositPreauthExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: EscrowCancel
let buildDetailedEscrowCancelExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: EscrowCreate
let buildDetailedEscrowCreateExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: EscrowFinish
let buildDetailedEscrowFinishExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: OfferCancel
let buildDetailedOfferCancelExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: OfferCreate
let buildDetailedOfferCreateExplanation = function(result)
{
    var commentDetails = [];

    commentDetails.push("**`" + result.Account + "`** placed an offer:");

    if (result.TakerGets instanceof Object) {
        commentDetails.push("`TakerGets`: **`" + result.TakerGets.value + "` " + result.TakerGets.currency + "/" + result.TakerGets.issuer + "**");
    } else {
        commentDetails.push("`TakerGets`: **`" + (result.TakerGets / 1000000) + "` XRP**");
    }

    if (result.TakerPays instanceof Object) {
        commentDetails.push("`TakerPays`: **`" + result.TakerPays.value + "` " + result.TakerPays.currency + "/" + result.TakerPays.issuer + "**");
    } else {
        commentDetails.push("`TakerPays`: **`" + (result.TakerPays / 1000000) + "` XRP**");
    }

    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: Payment - currently only supports a transfer from one account to another.
let buildDetailedPaymentExplanation = function(result)
{
    var commentDetails = [];

    commentDetails.push("");
    commentDetails.push("Account **`" + result.Account + "`** sent **`" + (result.meta.delivered_amount / 1000000) + "`** XRP to **`" + result.Destination + "`**");
    commentDetails.push("");

    commentDetails.push("| Account | XRP Balance Before | XRP Balance After | Difference | Explanation |");
    commentDetails.push("| :--- | ---: | ---: | ---: | :--- |");

    for (var i = 0; i < result.meta.AffectedNodes.length; i++) {

        var account = result.meta.AffectedNodes[i].ModifiedNode;
        var difference = ((account.FinalFields.Balance - account.PreviousFields.Balance) / 1000000);
        var formattedDifference = difference;

        if (difference > 0) {
            formattedDifference = "+" + difference;
        }

        var explanation = '';

        if (i === 0) {
            explanation = "`" + difference + "` received from **`" + ellipsifyAccount(result.Account) + "`**";
        } else if (i === 1) {
            explanation = "`" + difference + "` sent to **`" + ellipsifyAccount(result.Destination) + "`** + `" + ((result.Fee / 1000000)) + "` fee";
        }

        commentDetails.push("| `" + ellipsifyAccount(account.FinalFields.Account) + "` | `" + (account.PreviousFields.Balance / 1000000) + "` | `" + (account.FinalFields.Balance / 1000000) + "` | `" + formattedDifference + "` | " + explanation + " |");
    }

    commentDetails.push("| | | | **`" + (result.Fee / 1000000) + "`** | (the fee that was burned) |");
    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: PaymentChanncelClaim
let buildDetailedPaymentChannelClaimExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: PaymentChannelCreate
let buildDetailedPaymentChannelCreateExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: PaymentChannelFund
let buildDetailedPaymentChannelFundExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: SetRegularKey
let buildDetailedSetRegularKeyExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: SignerListSet
let buildDetailedSignerListSetExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

// Transaction Type: TrustSet
let buildDetailedTrustSetExplanation = function(result)
{
    var commentDetails = [];

    return commentDetails;
};

let ellipsifyAccount = function(account)
{
    return account.substring(0, 3) + ".." + account.substring(account.length - 3);
};

let getTransaction = async function(hash) {
    return await new Promise((resolve, reject) => {
        const Client = new WebSocket('wss://xrpl.ws')

        Client.on('open', e => {
            Client.send(JSON.stringify({
                command: 'tx',
                transaction: hash,
                binary: false
            }))
        })

        Client.on('message', data => {
            const response = resolve(JSON.parse(data));
            Client.close();
        })
    })
};

let linkToExplorer = function(id)
{
    return "[" + id + "](httpd://bithomp.com/explorer/" + id + ")";
};