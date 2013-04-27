Backend Querying
----------------
Expected Response for Node List:

    {
        "<id_0>":{name_0:"<candidate/industry name>" other_info:<...>},
        ...
        "<id_n>":{name_n:"<candidate/industry name>" other_info:<...>}
    }

Expected Response for Links List:

    [
        {source:"<source_1_id>", target:"<target_1_id>", value:"<dollars/votes>"},
        ...
        {source:"<source_n_id>", target:"<target_n_id>", value:"<dollars/votes>"}
    ]
