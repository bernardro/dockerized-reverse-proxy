exports.isNetworkNameMatch = (netName, suffix) => {
    return (new RegExp(`(\\w_)?${suffix}`, 'igu')).test(netName);
};

exports.isAttachedToPrxyNet = (containerInfo, networkSuffix) => {
    const networksObj = containerInfo.NetworkSettings.Networks;
    if (networkSuffix && networksObj) {
        const netwkNames = Object.keys(networksObj);
        return netwkNames.some(name => exports.isNetworkNameMatch(name, networkSuffix));
    }

    return false;
};

exports.getLabelBoolVal = (labelsRay, boolLabel) => {
    return boolLabel in labelsRay && labelsRay[boolLabel].toLowerCase() === 'true';
};
