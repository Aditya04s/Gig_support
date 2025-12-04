{
  "parser_instructions": [
    {
      "rule": "Normalization and Cleaning",
      "description": "All numerical values for monetary fields (total, basePay, bonus, distancePay, penalties) must be converted to standard floating-point numbers. Match and remove any currency symbols (like ₹, $, €) and commas (,) before conversion.",
      "code_hint": "RegEx: /(?:[₹$€£]|,)/g"
    },
    {
      "rule": "Total Payout Determination",
      "description": "The 'total' field must capture the net amount paid to the worker. Prioritize text lines containing identifiers like 'Net Total', 'Final Payout', or 'Total Earnings'. If ambiguous, choose the highest numeric value associated with a primary income field, or the field explicitly labeled 'Total'.",
      "field_key": "total"
    },
    {
      "rule": "Penalties Mapping",
      "description": "Penalties must be structured as an array of objects, where each object contains the specific 'type' of deduction and the associated 'amount' as a positive number.",
      "field_key": "penalties",
      "format": "[{ \"type\": \"string\", \"amount\": \"number\" }]"
    },
    {
      "rule": "Date and Platform Extraction",
      "description": "Extract the platform name (e.g., Swiggy, Uber) and parse the most recent date from the text (using YYYY-MM-DD format is recommended). Ratings should be extracted as an array of rating objects, or a single float if only one is found.",
      "field_keys": ["platform", "date", "ratings"]
    }
  ],
  "example_mapping": {
    "messy_extracted_text_input": [
      "Zomato Earnings Summary",
      "Period: 15/05/2025",
      "My Rating: 4.5",
      "Base Trip Pay: ₹1,250.00",
      "Distance Incentive: ₹350.50",
      "Bonus/Tips: ₹150",
      "Safety Fine Deduction: -₹25.00",
      "Net Payable: ₹1,725.50"
    ],
    "canonical_json_output": {
      "platform": "Zomato",
      "date": "2025-05-15",
      "total": 1725.50,
      "basePay": 1250.00,
      "bonus": 150.00,
      "distancePay": 350.50,
      "penalties": [
        {
          "type": "Safety Fine Deduction",
          "amount": 25.00
        }
      ],
      "ratings": [
        {
          "date": null,
          "rating": 4.5
        }
      ]
    }
  }
}