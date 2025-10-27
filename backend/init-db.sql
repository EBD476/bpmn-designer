-- Create database
CREATE DATABASE bpmn_designer;

-- Connect to database and create tables
CREATE TABLE bpmn_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) NOT NULL,
    description TEXT,
    xml_content TEXT NOT NULL,
    thumbnail TEXT,
    created_by VARCHAR(255) ,
    updated_by VARCHAR(255) ,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1
);

CREATE TABLE design_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID REFERENCES bpmn_designs(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    xml_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) ,
    comment TEXT
);

-- Indexes for better performance
CREATE INDEX idx_bpmn_designs_created_at ON bpmn_designs(created_at);
CREATE INDEX idx_bpmn_designs_tags ON bpmn_designs USING gin(tags);
CREATE INDEX idx_design_versions_design_id ON design_versions(design_id);


-- Insert sample data
INSERT INTO bpmn_designs (name, key, description, xml_content, tags) VALUES
(
    'Sample Order Process',
    'Test_Process',
    'A sample BPMN diagram for order processing',
    '<?xml version="1.0" encoding="UTF-8"?>
    <bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                      xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                      xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                      xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                      xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                      id="sample-diagram" 
                      targetNamespace="http://bpmn.io/schema/bpmn">
        <bpmn2:process id="Process_1" isExecutable="false">
            <bpmn2:startEvent id="StartEvent_1"/>
            <bpmn2:task id="Task_1" name="Process Order"/>
            <bpmn2:endEvent id="EndEvent_1"/>
            <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1"/>
            <bpmn2:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1"/>
        </bpmn2:process>
        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
            <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
                <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
                    <dc:Bounds x="173" y="102" width="36" height="36"/>
                </bpmndi:BPMNShape>
                <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
                    <dc:Bounds x="260" y="80" width="100" height="80"/>
                </bpmndi:BPMNShape>
                <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
                    <dc:Bounds x="412" y="102" width="36" height="36"/>
                </bpmndi:BPMNShape>
                <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
                    <di:waypoint x="209" y="120"/>
                    <di:waypoint x="260" y="120"/>
                </bpmndi:BPMNEdge>
                <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
                    <di:waypoint x="360" y="120"/>
                    <di:waypoint x="412" y="120"/>
                </bpmndi:BPMNEdge>
            </bpmndi:BPMNPlane>
        </bpmndi:BPMNDiagram>
    </bpmn2:definitions>',
    ARRAY['sample', 'order', 'process']
) ON CONFLICT DO NOTHING;