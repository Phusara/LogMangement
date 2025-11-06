from schemas.logs import FirewallLog, APILog, M365Log, NetworkLog, AWSLog, ADLog, CrowdStrikeLog


# Mapping of log types to field extractors
LOG_FIELD_EXTRACTORS = {
    FirewallLog: lambda log: {
        'vendor': log.vendor,
        'product': log.product,
        'src_ip': log.source_ip,
        'src_port': log.source_port,
        'dst_ip': log.dest_ip,
        'dst_port': log.dest_port,
        'protocol': log.protocol,
        'rule_name': log.rule_name,
        'rule_id': log.rule_id,
        'host': log.host,
    },
    APILog: lambda log: {
        'user': log.user,
        'src_ip': log.ip,
        'url': log.url,
    },
    M365Log: lambda log: {
        'user': log.user,
        'src_ip': log.ip,
    },
    NetworkLog: lambda log: {
        'host': log.host,
        'src_ip': log.source_ip,
        'protocol': getattr(log, 'protocol', None),
    },
    AWSLog: lambda log: {
        'user': log.user,
        'cloud_service': log.service,
        'cloud_account_id': log.account_id,
        'cloud_region': log.region,
    },
    ADLog: lambda log: {
        'user': log.user,
        'host': log.host,
        'src_ip': log.ip,
    },
    CrowdStrikeLog: lambda log: {
        'host': log.host,
        'process': log.process,
    },
}
