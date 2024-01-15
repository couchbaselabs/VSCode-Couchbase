import Dropdown from "components/inputs/dropdown/Dropdown";
import IqChat from "pages/chatscreen/IqChat";
import { useState } from "react";
import "./SelectOrganization.scss";

const SelectOrganizationPage = ({ organizationDetails, setShowPage }) => {
  const [selectedOrg, setSelectedOrg] = useState(undefined);
  const [rememberOrgChecked, setRememberOrgChecked] = useState(false);
  
  const handleOrgClick = (org) => {
    setSelectedOrg(org);
  };

  const handleRememberOrgCheckbox = () => {
    setRememberOrgChecked(!rememberOrgChecked);
  };

  const handleSubmit = () => {
    if (selectedOrg !== undefined) {
      // Verify if organization is allowed
      tsvscode.postMessage({
        command: "vscode-couchbase.iq.verifyOrganizationAndSave",
        value: {
          organizationDetails: selectedOrg,
          rememberOrgChecked: rememberOrgChecked
        }
      });
      // At the end, we shift to next page that is main iq chat
      setShowPage(<IqChat org={selectedOrg} />);
    }
  };
  return (
    <div className="selectOrganizationContainer">
      <h1>Select an organization</h1>
      <Dropdown
        triggerName="Select Organization"
        menu={organizationDetails.map((org) => {
          return (
            <button onClick={() => handleOrgClick(org)}>{org.data.name}</button>
          );
        })}
      />
      <div onClick={() => handleRememberOrgCheckbox()}>
        <input type="checkbox" id="rememberOrg" checked={rememberOrgChecked}/>
        <label>Remember the organization</label>
      </div>
      <p>
        {" "}
        Notes:
        <li>Please only select an organization where iQ is enabled.</li>
        <li>
          If you remember the organization, it will set it as default for future
          logins. you can change default in settings.
        </li>
      </p>
      <button className="redButton" onClick={() => handleSubmit()}>
        Submit
      </button>
    </div>
  );
};

export default SelectOrganizationPage;
