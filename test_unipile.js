async function send(payload, urlParams = "") {
  const url = `https://api26.unipile.com:15628/api/v1/linkedin/search?account_id=ZsyAZ1sLROSE2HdZN1O_Cw${urlParams}`;
  const res = await fetch(url, {
      method: "POST",
      headers: {
          "X-API-KEY": "JqRAyVtH.9Sg+NZfM/t2kThgp0+76fBKfuJnYetDyIGcCIAWImJM=",
          "Content-Type": "application/json",
          "Accept": "application/json"
      },
      body: JSON.stringify(payload)
  });
  const text = await res.text();
  console.log("PAYLOAD:", JSON.stringify(payload));
  if (res.status === 200) {
      console.log("SUCCESS!!!");
  } else {
      console.log("RESPONSE:", text);
  }
  console.log("------------------------");
}

async function run() {
  await send({ search_type: "PEOPLE", variables: "()" });
  await send({ search_type: "PEOPLE", variables: "(keyword:developer)" });
  await send({ search_type: "PEOPLE", variables: "(keywords:developer)" });
  await send({ search_type: "COMPANY", variables: "(keyword:stripe)" });
  await send({ search_type: "PEOPLE", variables: "(network:F)" });
}

run().catch(console.error);
